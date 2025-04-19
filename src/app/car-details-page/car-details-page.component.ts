import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, collection, addDoc } from '@angular/fire/firestore';
import { UserService } from '../services/user.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { register } from 'swiper/element/bundle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { addIcons } from 'ionicons';
import {colorFilterOutline,flashOutline, speedometerOutline,cogOutline,cashOutline,analyticsOutline} from 'ionicons/icons';
import { ToastController } from '@ionic/angular';

// Register Swiper custom elements
register();
@Component({
  selector: 'app-car-details-page',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './car-details-page.component.html',
  styleUrls: ['./car-details-page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CarDetailsPageComponent  implements OnInit{
  carId: string = '';
  car: any = null;
  owner: any = null;
  isLoading = true;
  rentalForm: FormGroup;
  isSubmitting = false;

  constructor(private route: ActivatedRoute,
    private firestore: Firestore,
    private userService: UserService,
    private toastController: ToastController,
    private fb: FormBuilder) {
      this.rentalForm = this.fb.group({
        pickupDate: ['', Validators.required],
        pickupTime: ['', Validators.required],
        dropoffDate: ['', Validators.required],
        dropoffTime: ['', Validators.required],
        specialRequests: ['']
      });
      

      addIcons({
        flashOutline,
        colorFilterOutline,
        speedometerOutline,
        cashOutline,
        cogOutline,
        analyticsOutline
        });

     }
     async ngOnInit() {
      this.carId = this.route.snapshot.paramMap.get('id')!;
      await this.loadCarDetails();
    }
  
    async loadCarDetails() {
      try {
        // Load car details
        const carRef = doc(this.firestore, `cars/${this.carId}`);
        const carSnap = await getDoc(carRef);
        
        if (carSnap.exists()) {
          this.car = { id: carSnap.id, ...carSnap.data() };
          
          // Load owner details
          this.owner = await this.userService.getUser(this.car.ownerId);
        }
      } catch (error) {
        console.error('Error loading car details:', error);
      } finally {
        this.isLoading = false;
      }
    }
    
    calculateTotal(): number {
      if (!this.car || !this.rentalForm.value.pickupDate || !this.rentalForm.value.dropoffDate) {
        return 0;
      }
      
      // Calculate the difference in days
      const pickupDate = new Date(this.rentalForm.value.pickupDate);
      const dropoffDate = new Date(this.rentalForm.value.dropoffDate);
      const diffTime = Math.abs(dropoffDate.getTime() - pickupDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      return diffDays * this.car.price_per_day;
    }
  
    async onSubmit() {
      if (this.rentalForm.invalid || this.isSubmitting) return;
      
      this.isSubmitting = true;
      
      try {
        const requestData = {
          carId: this.carId,
          carName: this.car.make_model,
          renterId: this.userService.currentUserId,
          ownerId: this.car.ownerId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          ...this.rentalForm.value,
          totalPrice: this.calculateTotal()
        };
  
        // Add the request to Firestore
        const requestsRef = collection(this.firestore, 'rentalRequests');
        await addDoc(requestsRef, requestData);
  
        // Show success message
        await this.showSuccessToast();
        
        // Reset form after successful submission
        this.rentalForm.reset();
      } catch (error) {
        console.error('Error submitting request:', error);
        await this.showErrorToast();
      } finally {
        this.isSubmitting = false;
      }
    }
  
    private async showSuccessToast() {
      const toast = await this.toastController.create({
        message: 'Request sent to owner!',
        duration: 3000,
        position: 'top',
        color: 'success',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  
    private async showErrorToast() {
      const toast = await this.toastController.create({
        message: 'Failed to send request. Please try again.',
        duration: 3000,
        position: 'top',
        color: 'danger',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }