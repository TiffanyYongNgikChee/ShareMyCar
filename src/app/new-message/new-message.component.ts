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

  allUsers: any[] = [];             // Full list of users
  filteredUsers: any[] = [];        // Filtered by search
  searchQuery: string = '';         // Bound to search input
  currentUserId = '';               // User ID of the person logged in
  existingChatUserIds: string[] = [];// For preventing duplicate chats (optional use)

  constructor(
    private modalCtrl: ModalController,
    private messageService: MessageService,
    private userService: UserService
  ) {
    // Load icons for use in the UI
    addIcons({
      add,
      close,
      personRemoveOutline
      });
  }

  async ngOnInit() {
    try {
      const users = await this.userService.getAllUsers(); // Or however you fetch users
      this.allUsers = users;
      this.filteredUsers = [...this.allUsers]; // Initialize filtered users with all users
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
  // Real-time filtering of users based on the username field.
  onSearch(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    console.log('Search query:', query);
    this.filteredUsers = this.allUsers.filter(user =>
      user.username.toLowerCase().includes(query)
    );
  }
  // Dismisses the modal and passes back the selected user’s ID.
  selectUser(user: UserProfile) {
    this.modalCtrl.dismiss({ selectedUserId: user.uid });
    
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}