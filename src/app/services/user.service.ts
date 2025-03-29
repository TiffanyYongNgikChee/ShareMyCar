import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth'; // Optional - for typing

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  // Add other user fields you store
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore) {}

  /**
   * Get user profile data from Firestore
   * @param uid User ID
   * @returns Promise with user data or null if not found
   */
  async getUser(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return {
          uid,
          ...userSnap.data()
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Get multiple users at once (for batch fetching)
   * @param uids Array of user IDs
   * @returns Promise with array of user data
   */
  async getUsers(uids: string[]): Promise<(UserProfile | null)[]> {
    return Promise.all(uids.map(uid => this.getUser(uid)));
  }
}