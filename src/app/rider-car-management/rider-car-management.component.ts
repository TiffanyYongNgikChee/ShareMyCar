import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from '../services/auth.service';
import { LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { 
  carOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface RentalRequest {
  id: string;
  carId: string;
  carName?: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected';
  pickupDate: string;
  dropoffDate: string;
  totalPrice: number;
  createdAt: string;
}

@Component({
  selector: 'app-rider-car-management',
  imports: [CommonModule, IonicModule,FormsModule],
  templateUrl: './rider-car-management.component.html',
  styleUrls: ['./rider-car-management.component.scss'],
})
export class RiderCarManagementComponent implements OnInit {
  requests: RentalRequest[] = [];
  isLoading = true;
  segmentValue = 'all';

  constructor(
    private router: Router,
    private firestore: Firestore,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) { addIcons({ carOutline });}

  async ngOnInit() {
    await this.loadRequests();
  }

  viewCarDetails(carId: string) {
    this.router.navigate(['/car', carId]);
  }

  async loadRequests() {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Loading your requests...'
    });
    await loading.present();

    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      const requestsRef = collection(this.firestore, 'rentalRequests');
      const q = query(requestsRef, where('renterId', '==', user.uid));

      onSnapshot(q, (snapshot) => {
        this.requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any
        })).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
        loading.dismiss();
      });
    } catch (error) {
      console.error('Error loading requests:', error);
      this.isLoading = false;
      loading.dismiss();
    }
  }

  getFilteredRequests() {
    switch (this.segmentValue) {
      case 'pending':
        return this.requests.filter(r => r.status === 'pending');
      case 'approved':
        return this.requests.filter(r => r.status === 'approved');
      case 'rejected':
        return this.requests.filter(r => r.status === 'rejected');
      default:
        return this.requests;
    }
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  }
}