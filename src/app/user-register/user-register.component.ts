import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { db } from '../../main'; // adjust the path based on your file structure
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule,IonicModule],
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss'],
})
export class UserRegisterComponent  implements OnInit {
  users: any[] = [];
  
  constructor() { }

  async ngOnInit() {
    await this.getUsers();
  }
  
  // Get all users
  async getUsers() {
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      
      this.users = [];
      querySnapshot.forEach((doc) => {
        this.users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Users loaded:', this.users);
    } catch (error) {
      console.error('Error getting users:', error);
    }
  }
  
  // Add a new user
  async addUser() {
    try {
      const usersCollection = collection(db, 'users');
      const docRef = await addDoc(usersCollection, {
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date()
      });
      
      console.log('User added with ID:', docRef.id);
      await this.getUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding user:', error);
    }
  }
  
  // Query users (example function)
  async queryUsersByEmail(email: string) {
    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Query results:', results);
      return results;
    } catch (error) {
      console.error('Error querying users:', error);
      return [];
    }
  }
  
  // Update a user
  async updateUser(userId: string, data: any) {
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, data);
      console.log('User updated');
      await this.getUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }
  
  // Delete a user
  async deleteUser(userId: string) {
    try {
      const userDoc = doc(db, 'users', userId);
      await deleteDoc(userDoc);
      console.log('User deleted');
      await this.getUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }
}