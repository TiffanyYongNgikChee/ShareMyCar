import { Injectable } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, getAuth } from 'firebase/auth';
import { collection, doc, setDoc,getDoc } from 'firebase/firestore';
import { db } from '../../main';  // Import Firestore instance
import { Router } from '@angular/router';
import { Auth} from '@angular/fire/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
type UserRole = 'rider' | 'owner';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();  // ✅ Use Firebase Auth directly
  private currentUserRole: string | null = null;

  constructor(private router: Router) {}

  // Update register method to include default role
  async register(email: string, password: string, username: string, phone: string, role: UserRole = 'rider') {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      if (userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          username,
          email,
          phone,
          address: '', // Initialize empty
          profilePicture: '', // URL will go here
          role, // Now always has a value
          verified: false
        });
        await sendEmailVerification(userCredential.user);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      if (!userCredential.user.emailVerified) {
        throw new Error('Please verify your email before logging in.');
      }
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        this.currentUserRole = userDoc.data()['role'];
      }
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  getCurrentUser(): Promise<any> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          // Get user role if available
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            this.currentUserRole = userDoc.data()['role'];
          }
        }
        resolve(user);
      });
    });
  }

  async logout() {
    await signOut(this.auth);
    this.currentUserRole = null;
    this.router.navigate(['/login']);
  }

  // Get the current user's role
  async getCurrentUserRole(uid: string): Promise<UserRole> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        // Return the role if it exists, otherwise default to 'rider'
        return userDoc.data()['role'] || 'rider';
      }
      return 'rider'; // Default if user doc doesn't exist
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'rider'; // Default if error occurs
    }
  }

  async updateUserRole(uid: string, newRole: string): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
      this.currentUserRole = newRole;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Navigate to appropriate car management page based on role
  navigateToCarManagement() {
    if (this.currentUserRole === 'owner') {
      this.router.navigate(['/owner-car-management']);
    } else {
      this.router.navigate(['/rider-car-management']);
    }
  }
}