// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage} from 'firebase/storage';
import { provideFirebaseApp} from '@angular/fire/app';
import { provideFirestore} from '@angular/fire/firestore';
import { provideAuth} from '@angular/fire/auth';

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


// Add this export to your existing main.ts
export const app = initializeApp(firebaseConfig); // Change from 'const' to 'export const'
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // Add this line

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideAuth(() => getAuth()),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
  ],
}).catch(err => console.error(err));

