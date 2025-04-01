import { Component, OnInit } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  deleteDoc, 
  updateDoc,
  onSnapshot,
  query,  // Add this import
  where    // Add this import
} from '@angular/fire/firestore';
import { AuthService } from '../services/auth.service';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../services/user.service';
import { RentalRequestsComponent } from '../rental-requests/rental-requests.component';
import { 
  add,
  addOutline,        // For add/register buttons
  carSportOutline,   // For car-related elements
  eyeOutline,        // For available toggle
  eyeOffOutline,     // For not-available toggle
  createOutline,     // For edit
  trashOutline,      // For delete
  listOutline,       // For rental requests
  arrowBackOutline,  // For back button
  personOutline,      // For owner info
  image,
  notificationsOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface Car {
  id: string;
  make_model: string;
  car_type: string;
  year: number;
  price_per_day: number;
  isAvailable: boolean;
  images: string[];
  ownerId: string;
}
interface RentalRequest {
  id: string;
  carId: string;
  renterId: string;
  status: 'pending' | 'approved' | 'rejected';
  pickupDate: string;
  dropoffDate: string;
  totalPrice: number;
  // Add other fields as needed
}

@Component({
  selector: 'app-owner-car-management',
  templateUrl: './owner-car-management.component.html',
  imports: [CommonModule, IonicModule],
  standalone: true,
  styleUrls: ['./owner-car-management.component.scss'],
})
export class OwnerCarManagementComponent  implements OnInit {
  cars: Car[] = [];
  isLoading = true;
  rentalRequests: RentalRequest[] = [];
  carRequestCounts: {[carId: string]: number} = {};

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {
    addIcons({
      addOutline,
      carSportOutline,
      eyeOutline,
      eyeOffOutline,
      createOutline,
      trashOutline,
      listOutline,
      arrowBackOutline,
      personOutline,
      image,
      notificationsOutline
    });
  }

  async ngOnInit() {
    await this.loadCars();
    this.setupRequestListener();
    
  }

  async loadCars() {
    this.isLoading = true;
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.isLoading = false;
      return;
    }
  
    const carsRef = collection(this.firestore, 'cars');
    const q = query(carsRef, where('ownerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      this.cars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Car));
      this.isLoading = false;
      this.updateRequestCounts();
    });
  }

  setupRequestListener() {
    this.authService.getCurrentUser().then(user => {
      if (!user) return;

      const requestsRef = collection(this.firestore, 'rentalRequests');
      const q = query(
        requestsRef,
        where('ownerId', '==', user.uid),
        where('status', '==', 'pending')
      );

      onSnapshot(q, (snapshot) => {
        this.rentalRequests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RentalRequest));
        this.updateRequestCounts();
      });
    });
  }

  updateRequestCounts() {
    this.carRequestCounts = {};
    this.rentalRequests.forEach(request => {
      if (!this.carRequestCounts[request.carId]) {
        this.carRequestCounts[request.carId] = 0;
      }
      this.carRequestCounts[request.carId]++;
    });
  }

  async viewRentalRequests(carId: string) {
    const modal = await this.modalCtrl.create({
      component: RentalRequestsComponent,
      componentProps: {
        carId: carId
      }
    });
    await modal.present();
  }

  async toggleAvailability(car: Car) {
    const loading = await this.loadingCtrl.create({
      message: 'Updating availability...',
    });
    await loading.present();

    try {
      const carRef = doc(this.firestore, `cars/${car.id}`);
      await updateDoc(carRef, {
        isAvailable: !car.isAvailable
      });
      car.isAvailable = !car.isAvailable;
    } catch (error) {
      console.error('Error updating car:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Failed to update car availability',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss();
    }
  }

  async deleteCar(carId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this car?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Deleting car...',
            });
            await loading.present();

            try {
              const carRef = doc(this.firestore, `cars/${carId}`);
              await deleteDoc(carRef);
              this.cars = this.cars.filter(c => c.id !== carId);
            } catch (error) {
              console.error('Error deleting car:', error);
              const errorAlert = await this.alertCtrl.create({
                header: 'Error',
                message: 'Failed to delete car',
                buttons: ['OK']
              });
              await errorAlert.present();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  editCar(carId: string) {
    this.router.navigate(['/edit-car', carId]);
  }

  registerNewCar() {
    this.router.navigate(['/car-register']);
  }
}