import { Component, Input,OnInit } from '@angular/core';
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
export class RentalRequestsComponent implements OnInit{
  @Input() carId: string = '';
  @Input() requests!: any[];
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  isLoading = true;

  constructor(
    private firestore: Firestore,
    private modalCtrl: ModalController
  ) { 
    addIcons({ checkmarkCircleOutline });
  }

  async ngOnInit() {
    await this.loadRequests();
  }

  async loadRequests() {
    try {
      const requestsRef = collection(this.firestore, 'rentalRequests');
      const q = query(
        requestsRef,
        where('carId', '==', this.carId),
        
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

  get filteredRequests() {
    if (this.statusFilter === 'all') return this.requests;
    return this.requests.filter(req => req.status === this.statusFilter);
  }

  async updateRequestStatus(requestId: string, status: 'approved' | 'rejected') {
    const requestRef = doc(this.firestore, `rentalRequests/${requestId}`);
    await updateDoc(requestRef, { status });
  }

  async respondToRequest(requestId: string, status: 'approved'|'rejected') {
    try {
      const requestRef = doc(this.firestore, `rentalRequests/${requestId}`);
      await updateDoc(requestRef, { status });
      // Remove the request from the local array
      this.requests = this.requests.filter(req => req.id !== requestId);
    } catch (error) {
      console.error('Error updating request:', error);
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium';
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

}
