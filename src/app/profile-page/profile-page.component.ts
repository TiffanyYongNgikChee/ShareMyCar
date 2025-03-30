import { Component, OnInit} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../services/storage.service';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../main';
import { addIcons } from 'ionicons';
import { camera, cloudUpload, save, carSport,logOutOutline } from 'ionicons/icons';
type UserRole = 'rider' | 'owner';

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, IonicModule,ReactiveFormsModule,FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit{
  currentRole: UserRole = 'rider';
  userData: any = {
    username: '',
    email: '',
    phone: '',
    address: '',
    profilePicture: ''
  };
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isLoading = false;

  constructor(private authService: AuthService,
    private storageService: StorageService) {
      // Add icons in constructor
      addIcons({ camera, cloudUpload, save, carSport,logOutOutline });
    }

    logout() {
      this.authService.logout();
    }

    async ngOnInit() {
      this.isLoading = true;
      try {
        const user = await this.authService.getCurrentUser();
        if (user) {
          // Load user role
          this.currentRole = await this.authService.getCurrentUserRole(user.uid);
          
          // Load user profile data
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            this.userData = {
              ...this.userData, // Defaults
              ...docSnap.data() // Override with stored data
            };
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        this.isLoading = false;
      }
    }
  
    async changeRole(newRole: UserRole) {
      try {
        const user = await this.authService.getCurrentUser();
        if (user) {
          await this.authService.updateUserRole(user.uid, newRole);
          this.currentRole = newRole;
        }
      } catch (error) {
        console.error('Error changing role:', error);
      }
    }
  
    onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = () => this.previewUrl = reader.result;
        reader.readAsDataURL(file);
      }
    }
  
    async uploadPicture() {
      if (!this.selectedFile) return;
      
      try {
        this.isLoading = true;
        const user = await this.authService.getCurrentUser();
        if (user) {
          this.userData.profilePicture = await this.storageService.uploadProfilePicture(
            user.uid, 
            this.selectedFile
          );
          await this.updateProfile();
          this.selectedFile = null; // Reset after successful upload
        }
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  
    async updateProfile() {
      try {
        this.isLoading = true;
        const user = await this.authService.getCurrentUser();
        if (user) {
          await setDoc(
            doc(db, 'users', user.uid), 
            this.userData, 
            { merge: true }
          );
          // Optional: Show success message
        }
      } catch (error) {
        console.error('Update error:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  
    onCarIconClick() {
      this.authService.navigateToCarManagement();
    }
  }