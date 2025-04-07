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
}

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
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
    const messagesSubject = new BehaviorSubject<Message[]>([]);
    
    if (!this.currentUserId) {
      this.authService.getCurrentUser().then(user => {
        if (user) {
          this.currentUserId = user.uid;
          this.setupMessagesListener(otherUserId, messagesSubject);
        }
      });
    } else {
      this.setupMessagesListener(otherUserId, messagesSubject);
    }

    return messagesSubject.asObservable();
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

    // Get all user names in one batch
    const userNames = new Map<string, string>();
    const userPromises = Array.from(userIds).map(async userId => {
      const userDoc = await getDoc(doc(db, 'userNames', userId));
      userNames.set(userId, userDoc.exists() ? userDoc.data()['name'] : 'Unknown');
    });
    await Promise.all(userPromises);

    // Now build conversations
    querySnapshot.forEach(doc => {
      const message = doc.data() as Message;
      const otherUserId = message.senderId === this.currentUserId ? message.receiverId : message.senderId;
      const otherUserName = userNames.get(otherUserId) || 'Unknown';

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: message.content,
          timestamp: message.timestamp?.toDate() || new Date(),
          unreadCount: message.receiverId === this.currentUserId && !message.read ? 1 : 0
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