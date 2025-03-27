import { Component, OnInit} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
type UserRole = 'rider' | 'owner';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, IonicModule,ReactiveFormsModule,FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit{
  currentRole: UserRole = 'rider'; // Initialize with default

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentRole = await this.authService.getCurrentUserRole(user.uid);
    }
  }

  async changeRole(newRole: UserRole) {
    const user = await this.authService.getCurrentUser();
    if (user) {
      await this.authService.updateUserRole(user.uid, newRole);
      this.currentRole = newRole;
    }
  }

  onCarIconClick() {
    this.authService.navigateToCarManagement();
  }
}
