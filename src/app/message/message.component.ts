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
import {add,chatbubbleOutline,send,chatbubblesOutline,checkmarkDone,arrowBack,home} from 'ionicons/icons';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../main';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-message',
  imports: [CommonModule, IonicModule,FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent  implements OnInit, OnDestroy {
  // Initialize properties to avoid definite assignment errors
  conversations$: Observable<Conversation[]> = of([]); // Holds the list of all conversations
  activeChat$: Observable<Message[]> = of([]); // Not currently used, could be used for live chat updates
  currentUserId: string = '';// ID of the current logged-in user
  selectedUserId: string | null = null; // User ID of the selected conversation partner
  newMessage = ''; // Message input from the user
  isLoading = true; // Spinner control while loading data
  hasConversations = false; // Toggle based on whether there are conversations
  otherUserName: string = ''; // Name of the user you’re chatting with
  messages: Message[] = []; // Stores messages locally for display
  isChatOpen = false; // Whether the chat panel is open

  private subscriptions: Subscription[] = []; // Keeps track of live subscriptions to clean up

  showCustomKeyboard = false; // Controls custom on-screen keyboard
  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalCtrl: ModalController
  ) {
    addIcons({
      add,
      chatbubbleOutline,
      send,
      chatbubblesOutline,
      checkmarkDone,
      arrowBack,
      home
      });
  }
  // Component lifecycle hook: runs on component initialization
  async ngOnInit() {
    console.log('Initializing MessageComponent');
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return;
    }
    this.currentUserId = user.uid;
    console.log('Current user ID:', this.currentUserId); 

    // Fetch conversations and determine if one is pre-selected via route
    this.conversations$ = new Observable<Conversation[]>(subscriber => {
      console.log('Fetching conversations...');
      this.messageService.getConversations().then(
        conversations => {
          console.log('Conversations received:', conversations); 
          subscriber.next(conversations);
          subscriber.complete();
          this.hasConversations = conversations.length > 0;
          this.isLoading = false;
          
          // If a conversation user ID is passed in the route, select it
          this.route.paramMap.subscribe(params => {
            console.log('Route params:', params); 
            const userId = params.get('userId');
            if (userId) {
              this.selectConversation(userId);
            } else if (conversations.length > 0) {
              // Default to first conversation if none selected
              this.selectConversation(conversations[0].userId); // Default to first
            }
          });
        },
        error => {
          console.error('Error getting conversations:', error);
          subscriber.error(error);
        }
      );
    });
  }

  // Select a conversation, load messages, and set up Firestore subscription
  async selectConversation(userId: string) {
    this.selectedUserId = userId;
    this.messages = []; // Clear previous messages

    // Load user details
    const userDetails = await this.messageService.getUserDetails(userId);
    this.otherUserName = userDetails.name;

    // Subscribe to Firestore messages
    const sub = this.messageService.getChatMessages(userId).subscribe({
      next: (firestoreMessages) => {
        // Replace local messages with fresh Firestore data
        this.messages = [...firestoreMessages]
          .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        
        // Mark messages as read
        this.markMessagesAsRead(firestoreMessages);
      },
      error: (err) => console.error('Error loading messages:', err)
    });
    this.subscriptions.push(sub);
  }

  // Send message to selected user
  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUserId) return;

    // Create temporary message
    const tempMessage: Message = {
      senderId: this.currentUserId,
      senderName: await this.getCurrentUserName(),
      receiverId: this.selectedUserId,
      content: this.newMessage,
      timestamp: { seconds: Math.floor(Date.now() / 1000) },
      read: false
    };

    // Add to local array immediately
    this.messages = [...this.messages, tempMessage];
    this.newMessage = '';

    try {
      // Send to Firestore
      await this.messageService.sendMessage(this.selectedUserId, tempMessage.content);
    } catch (error) {
      console.error('Send failed:', error);
      // Remove failed message
      this.messages = this.messages.filter(m => m !== tempMessage);
    }

    this.messageService.getChatMessages(this.selectedUserId).subscribe(messages => {
      console.log('After send:', messages);
    });
  }
  // Mark unread messages as read
  private markMessagesAsRead(messages: Message[]) {
    const unreadIds = messages
      .filter(m => m.receiverId === this.currentUserId && !m.read && m.id)
      .map(m => m.id as string);
    
    if (unreadIds.length > 0) {
      this.messageService.markMessagesAsRead(unreadIds);
    }
  }
  // Mark unread messages as read
  private async getCurrentUserName(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) return 'You';
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() ? userDoc.data()['username'] : 'You';
  }
  // Open modal for starting a new message thread
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
      this.isChatOpen = true; // ⬅️ This will show the chat page
    }
  }
  // Called when a chat is tapped in the UI
  openChat(conv: any) {
    this.selectedUserId = conv.userId;
    this.otherUserName = conv.userName;
    this.isChatOpen = true;
    this.selectConversation(conv.userId);
  }
  // Closes chat panel and resets related state
  closeChat() {
    this.selectedUserId = null;
    this.otherUserName = '';
    this.isChatOpen = false;
  }
  // Handles custom back button behavior
  handleBackButton() {
    if (this.isChatOpen) {
      this.closeChat();
    } else {
      this.goBackHome();
    }
  }
  // Decide whether to display date above message bubble
  shouldShowDate(previousMessage: any, currentMessage: any): boolean {
    if (!previousMessage) return true; // First message should show date
    
    const prevDate = new Date(previousMessage.timestamp?.seconds * 1000);
    const currDate = new Date(currentMessage.timestamp?.seconds * 1000);
    
    return (
      prevDate.getDate() !== currDate.getDate() ||
      prevDate.getMonth() !== currDate.getMonth() ||
      prevDate.getFullYear() !== currDate.getFullYear()
    );
  }
  // Navigate user back to the home page
  goBackHome() {
    this.router.navigate(['/home']); // Or your home page route
  }
  // Lifecycle hook to clean up subscriptions
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  // Focus the input and optionally show custom keyboard (native only)
  async focusInput() {
    const input = document.querySelector('.composer-input') as HTMLIonInputElement | null;
  
    if (input) {
      await input.setFocus();
  
      // Only call the Keyboard plugin on native platforms
      if (Capacitor.isNativePlatform()) {
        await Keyboard.show();
      }
  
      this.showCustomKeyboard = true;
    }
  }
  // Hide custom keyboard on native platforms
  hideKeyboard() {
    this.showCustomKeyboard = false;
  
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    }
  }

}