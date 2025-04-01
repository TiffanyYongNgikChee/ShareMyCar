import { Component, Input } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular';
import { 
  checkmarkCircleOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-rental-requests',
  imports: [CommonModule, IonicModule,FormsModule],
  templateUrl: './rental-requests.component.html',
  styleUrls: ['./rental-requests.component.scss'],
})
export class RentalRequestsComponent{
  @Input() carId: string = '';
  requests: any[] = [];
  isLoading = true;

  constructor(
    private firestore: Firestore,
    private modalCtrl: ModalController
  ) {
    addIcons({ checkmarkCircleOutline });
  }

  async loadRequests() {
    try {
      const requestsRef = collection(this.firestore, 'rentalRequests');
      const q = query(
        requestsRef,
        where('carId', '==', this.carId),
        where('status', '==', 'pending')
      );

      onSnapshot(q, (snapshot) => {
        this.requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Error loading requests:', error);
      this.isLoading = false;
    }
  }



  async respondToRequest(requestId: string, status: string) {
    const requestRef = doc(this.firestore, `rentalRequests/${requestId}`);
    await updateDoc(requestRef, { status });
    // Optionally notify the renter here
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
