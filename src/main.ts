// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Initialize Firebase directly
const firebaseConfig = {
  apiKey: "AIzaSyAHBvXki4T79qk9k5MYPwRrHSbDdbvCxIQ",
  authDomain: "share-my-car-88726.firebaseapp.com",
  projectId: "share-my-car-88726",
  storageBucket: "share-my-car-88726.firebasestorage.app",
  messagingSenderId: "923357827742",
  appId: "1:923357827742:web:e5348119af26898587218f",
  measurementId: "G-4LKVF26SBL"
};

// Initialize Firebase globally
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
}).catch(err => console.error(err));

