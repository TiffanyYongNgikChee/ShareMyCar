import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { UserService } from '../services/user.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { register } from 'swiper/element/bundle';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

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

  constructor(private route: ActivatedRoute,
    private firestore: Firestore,
    private userService: UserService,
    private fb: FormBuilder) {
      this.rentalForm = this.fb.group({
        pickupDate: ['', Validators.required],
        pickupTime: ['', Validators.required],
        dropoffDate: ['', Validators.required],
        dropoffTime: ['', Validators.required],
        specialRequests: ['']
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
      
      // This would be calculation logic
      const days = 1; // Replace with actual day calculation
      return days * this.car.price_per_day;
    }
  
    onSubmit() {
      if (this.rentalForm.valid) {
        console.log('Rental request:', {
          carId: this.carId,
          ...this.rentalForm.value,
          totalPrice: this.calculateTotal()
        });
        // Add submission logic here
      }
    }
  }