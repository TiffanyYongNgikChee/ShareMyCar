import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MessageService } from '../services/message.service';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../main';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import {add,close,personRemoveOutline} from 'ionicons/icons';

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  profilePicture?: string;
}
@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [CommonModule, IonicModule,FormsModule],
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss'],
})
export class NewMessageComponent implements OnInit {

  allUsers: UserProfile[] = [];
  filteredUsers: UserProfile[] = [];
  searchQuery: string = '';
  currentUserId = '';
  existingChatUserIds: string[] = [];

  constructor(
    private modalCtrl: ModalController,
    private messageService: MessageService,
    private userService: UserService
  ) {
    addIcons({
      add,
      close,
      personRemoveOutline
      });
  }

  async ngOnInit() {
    const user = await this.userService.currentUser$.toPromise();
    if (!user) return;
    this.currentUserId = user.uid;

    // 1. Get existing conversations to exclude
    const conversations = await this.messageService.getConversations();
    this.existingChatUserIds = conversations.map(c => c.userId);

    // 2. Get all users (maybe from your Firestore /users collection)
    const all = await this.getAllUsersExceptCurrent();
    
    // 3. Filter out users we already chat with
    this.allUsers = all.filter(u => !this.existingChatUserIds.includes(u.uid));
    this.filteredUsers = [...this.allUsers]; // initial display
  }

  async getAllUsersExceptCurrent(): Promise<UserProfile[]> {
    // You can customize this to fetch all users from Firestore directly
    const response = await fetch('/assets/mock-users.json'); // replace with your actual DB fetch logic
    const users: UserProfile[] = await response.json();
    return users.filter(u => u.uid !== this.currentUserId);
  }

  onSearch(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    this.filteredUsers = this.allUsers.filter(user =>
      user.username.toLowerCase().includes(query)
    );
  }

  selectUser(user: UserProfile) {
    this.modalCtrl.dismiss({ selectedUserId: user.uid });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}