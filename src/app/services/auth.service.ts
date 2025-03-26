import { Injectable } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, getAuth } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../main';  // Import Firestore instance
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();  // ✅ Use Firebase Auth directly

  constructor(private router: Router) {}

  async register(email: string, password: string, username: string, phone: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      if (userCredential.user) {
        await setDoc(doc(collection(db, 'users'), userCredential.user.uid), {
          uid: userCredential.user.uid,
          username,
          email,
          phone,
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
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
