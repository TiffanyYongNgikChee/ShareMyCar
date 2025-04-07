import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, collection,getDocs } from '@angular/fire/firestore';
import { Auth, authState, User } from '@angular/fire/auth';
import { Observable, of, from,map } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  currentUser$: Observable<User | null>;
  currentUserProfile$: Observable<UserProfile | null>;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {
    // Initialize current user observable
    this.currentUser$ = authState(this.auth);

    // Initialize current user profile observable
    this.currentUserProfile$ = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.getUser(user.uid);
        } else {
          return of(null);
        }
      })
    );
  }

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
   * Get current user ID synchronously
   * @returns Current user ID or null if not logged in
   */
  get currentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Get multiple users at once (for batch fetching)
   * @param uids Array of user IDs
   * @returns Promise with array of user data
   */
  async getUsers(uids: string[]): Promise<(UserProfile | null)[]> {
    return Promise.all(uids.map(uid => this.getUser(uid)));
  }

  // Add this method to your UserService
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        
        // Destructure and exclude 'uid' from the userData object
        const { uid, ...userWithoutUid } = userData;
  
        // Ensure 'uid' is set from doc.id
        users.push({
          uid: doc.id,   // Explicitly set the uid here from doc.id
          ...userWithoutUid // Spread the rest of the user data, excluding 'uid'
        });
      });
  
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }
}


