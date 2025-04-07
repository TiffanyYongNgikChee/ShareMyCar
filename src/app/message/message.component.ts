import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MessageService, Message, Conversation } from '../services/message.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subscription, BehaviorSubject, combineLatest,of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NewMessageComponent } from '../new-message/new-message.component';
import { addIcons } from 'ionicons';
import {add} from 'ionicons/icons';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../main';

@Component({
  selector: 'app-message',
  imports: [CommonModule, IonicModule,FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent  implements OnInit, OnDestroy {
  // Initialize properties to avoid definite assignment errors
  conversations$: Observable<Conversation[]> = of([]);
  activeChat$: Observable<Message[]> = of([]);
  currentUserId: string = '';
  selectedUserId: string = '';
  newMessage = '';
  isLoading = true;
  hasConversations = false;
  otherUserName: string = '';
  messages: Message[] = []; // for local message storage

  private subscriptions: Subscription[] = [];

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalCtrl: ModalController
  ) {
    addIcons({
      add
      });
  }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = user.uid;

    // Convert Promise to Observable
    this.conversations$ = new Observable<Conversation[]>(subscriber => {
      this.messageService.getConversations().then(
        conversations => {
          subscriber.next(conversations);
          subscriber.complete();
          this.hasConversations = conversations.length > 0;
          this.isLoading = false;
          
          // Check if there's a user ID in the route
          this.route.paramMap.subscribe(params => {
            const userId = params.get('userId');
            if (userId) {
              this.selectConversation(userId);
            } else if (conversations.length > 0) {
              // Default to first conversation if none selected
              this.selectConversation(conversations[0].userId);
            }
          });
        },
        error => subscriber.error(error)
      );
    });
  }

  async selectConversation(userId: string) {
    this.selectedUserId = userId;
    this.messages = []; // Reset messages when conversation changes
  
    // Load user details first
    const userDetails = await this.messageService.getUserDetails(userId);
    this.otherUserName = userDetails.name;

    // Combine local updates with Firestore stream
    this.activeChat$ = this.messageService.getChatMessages(userId).pipe(
      tap(messages => {
        // Merge with any locally added messages
        const allMessages = [...this.messages, ...messages]
          .filter((v, i, a) => a.findIndex(m => m.id === v.id) === i)
          .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
        
        this.messages = allMessages;

        const unreadMessages = messages
          .filter(m => m.receiverId === this.currentUserId && !m.read && m.id)
          .map(m => m.id as string);
        
        if (unreadMessages.length > 0) {
          this.messageService.markMessagesAsRead(unreadMessages);
        }
      })
    );
      // Update URL to reflect selected conversation
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { userId },
        replaceUrl: true
      });
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUserId) return;
    
    // Create temporary local message
    const tempMessage: Message = {
      senderId: this.currentUserId,
      senderName: this.otherUserName, // Or get from auth service
      receiverId: this.selectedUserId,
      content: this.newMessage,
      timestamp: { seconds: Math.floor(Date.now() / 1000) } as any,
      read: false,
      isLocal: true // Optional flag for local messages
    };

    // Add to local array immediately
    this.messages = [...this.messages, tempMessage];
    this.newMessage = '';

    try {
      await this.messageService.sendMessage(this.selectedUserId, tempMessage.content);
      
      // Remove local flag after successful send
      this.messages = this.messages.map(m => 
        m === tempMessage ? {...m, isLocal: false} : m
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message
      this.messages = this.messages.filter(m => m !== tempMessage);
    }
  }

  private async getCurrentUserName(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) return 'You';
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() ? userDoc.data()['username'] : 'You';
  }

  async openNewMessageModal() {
    const modal = await this.modalCtrl.create({
      component: NewMessageComponent,
      componentProps: {
        currentUserId: this.currentUserId
      }
    });
    
    await modal.present();
    
    const { data } = await modal.onWillDismiss();
    if (data?.selectedUserId) {
      this.selectConversation(data.selectedUserId);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}