import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  or,
  and
} from 'firebase/firestore';
import { db } from '../../main'; // Import Firestore instance
import { AuthService } from './auth.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: any;
  read: boolean;
  isLocal?: boolean; // Add this optional flag
}

export interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messagesCollection = collection(db, 'messages');
  private currentUserId: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.currentUserId = user.uid;
      }
    });
  }

  // Get real-time messages between two users
  getChatMessages(otherUserId: string): Observable<Message[]> {
    console.log('Fetching messages between', this.currentUserId, 'and', otherUserId); // Debug 1
    
    return new Observable(subscriber => {
      if (!this.currentUserId) {
        subscriber.error('User not authenticated');
        return;
      }
  
      // Create two separate queries
      const sentQuery = query(
        this.messagesCollection,
        where('senderId', '==', this.currentUserId),
        where('receiverId', '==', otherUserId),
        orderBy('timestamp', 'asc')
      );
  
      const receivedQuery = query(
        this.messagesCollection,
        where('senderId', '==', otherUserId),
        where('receiverId', '==', this.currentUserId),
        orderBy('timestamp', 'asc')
      );
  
      // Combine results
      Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]).then(([sentSnap, receivedSnap]) => {
        const messages: Message[] = [];
        
        sentSnap.forEach(doc => messages.push({ id: doc.id, ...doc.data() as Message }));
        receivedSnap.forEach(doc => messages.push({ id: doc.id, ...doc.data() as Message }));
  
        // Sort combined results
        messages.sort((a, b) => 
          (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );
        
        subscriber.next(messages);
        subscriber.complete();
      }).catch(err => subscriber.error(err));
    });
  }

  private setupMessagesListener(otherUserId: string, subject: BehaviorSubject<Message[]>) {
    if (!this.currentUserId) return;

    const q = query(
      this.messagesCollection,
      or(
        and(
          where('senderId', '==', this.currentUserId),
          where('receiverId', '==', otherUserId)
        ),
        and(
          where('senderId', '==', otherUserId),
          where('receiverId', '==', this.currentUserId)
        )
      ),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data() as Message
        });
      });
      subject.next(messages);
    });

    return () => unsubscribe();
  }

  // Send a new message
  async sendMessage(receiverId: string, content: string): Promise<void> {
    if (!this.currentUserId) {
      const user = await this.authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      this.currentUserId = user.uid;
    }

    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) return;

    // Get sender and receiver names from users collection
    const [senderDoc, receiverDoc] = await Promise.all([
      getDoc(doc(db, 'users', currentUser.uid)),
      getDoc(doc(db, 'users', receiverId))
    ]);

    const senderName = senderDoc.exists() ? senderDoc.data()['username'] : 'Anonymous';
    const receiverName = receiverDoc.exists() ? receiverDoc.data()['username'] : 'Unknown';

    const message: Message = {
      senderId: currentUser.uid,
      senderName: senderName,
      receiverId: receiverId,
      content: content,
      timestamp: serverTimestamp(),
      read: false
    };

    try {
      await setDoc(doc(this.messagesCollection), message);
      
      // Store receiver name in a separate collection for easy lookup
      await setDoc(doc(db, 'userNames', receiverId), {
        name: receiverName
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const batch = writeBatch(db);
    messageIds.forEach(id => {
      const messageRef = doc(this.messagesCollection, id);
      batch.update(messageRef, { read: true });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get list of conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    if (!this.currentUserId) {
      const user = await this.authService.getCurrentUser();
      if (!user) return [];
      this.currentUserId = user.uid;
    }

    const q = query(
      this.messagesCollection,
      or(
        where('senderId', '==', this.currentUserId),
        where('receiverId', '==', this.currentUserId)
      ),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversationsMap = new Map<string, Conversation>();

    // First get all unique user IDs from messages
    const userIds = new Set<string>();
    querySnapshot.forEach(doc => {
      const message = doc.data() as Message;
      const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
      userIds.add(otherUserId);
    });

    // Get all user details (including photoUrl) in one batch
  const userDetails = new Map<string, { name: string, photoUrl: string }>();
  const userPromises = Array.from(userIds).map(async userId => {
    const details = await this.getUserDetails(userId); // Reuse existing method
    userDetails.set(userId, details);
  });
  await Promise.all(userPromises);

  // Build conversations with photoUrl
  querySnapshot.forEach(doc => {
    const message = doc.data() as Message;
    const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
    const details = userDetails.get(otherUserId) || { name: 'Unknown', photoUrl: '' };

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        userId: otherUserId,
        userName: details.name,
        lastMessage: message.content,
        timestamp: message.timestamp?.toDate() || new Date(),
        unreadCount: message.receiverId === this.currentUserId && !message.read ? 1 : 0,
        photoUrl: details.photoUrl  // Add this
      });
    }
  });

  return Array.from(conversationsMap.values());
}

  // Get user details for chat
  async getUserDetails(userId: string): Promise<{ name: string, photoUrl: string }> {
    const [userDoc, profileDoc] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDoc(doc(db, 'userNames', userId))
    ]);
    
    const name = profileDoc.exists() 
      ? profileDoc.data()['name'] 
      : userDoc.exists() 
        ? userDoc.data()['username'] 
        : 'Unknown';
    
    const photoUrl = userDoc.exists() ? userDoc.data()['profilePicture'] || '' : '';

    return { name, photoUrl };
  }
}