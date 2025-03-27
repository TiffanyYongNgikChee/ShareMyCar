import { Injectable } from '@angular/core';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../../main'; // Import the initialized app from main.ts

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = getStorage(app); // Use the already initialized app

  async uploadProfilePicture(uid: string, file: File): Promise<string> {
    try {
      // Create a reference with a unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const storageRef = ref(this.storage, `profile-pictures/${uid}/profile_${timestamp}.${fileExt}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}