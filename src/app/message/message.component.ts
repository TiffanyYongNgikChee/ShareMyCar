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

  selectConversation(userId: string) {
    this.selectedUserId = userId;
    this.activeChat$ = this.messageService.getChatMessages(userId).pipe(
      tap(messages => {
        // Filter out undefined IDs and mark messages as read
        const unreadMessages = messages
          .filter(m => m.receiverId === this.currentUserId && !m.read && m.id)
          .map(m => m.id as string); // Cast to string[] since we filtered out undefined
        
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
    
    try {
      await this.messageService.sendMessage(this.selectedUserId, this.newMessage);
      this.newMessage = '';
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
    }
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