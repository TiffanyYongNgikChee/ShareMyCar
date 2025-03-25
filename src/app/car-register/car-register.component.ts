import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { db } from '../../main'; // Adjust based on your structure
import { collection, addDoc } from 'firebase/firestore';

@Component({
  selector: 'app-car-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './car-register.component.html',
  styleUrls: ['./car-register.component.scss'],
})
export class CarRegisterComponent {
  carForm: FormGroup;
  showToast = false;

  constructor(private fb: FormBuilder) {
    this.carForm = this.fb.group({
      make_model: ['', Validators.required],
      car_type: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]],
      color: [''],
      transmission: [''],
      seats: ['', Validators.min(1)],
      fuel_type: [''],
      engine: [''],
      price_per_hour: ['', Validators.min(0)],
      price_per_day: ['', Validators.min(0)],
      fuel_charge: [''],
      mileage_limit: [''],
      insurance_fee: [''],
      deposit: [''],
      pickup_location: ['', Validators.required],
      image_url: [''] // Allow users to input a car image URL
    });
  }

  async submitCar() {
    if (!this.carForm.valid) return;

    try {
      const carsCollection = collection(db, 'cars');
      const carData = {
        ...this.carForm.value,
        created_at: new Date()
      };

      const docRef = await addDoc(carsCollection, carData);
      console.log('Car registered with ID:', docRef.id);
      this.carForm.reset();
      this.showToast = true;
    } catch (error) {
      console.error('Error adding car:', error);
    }
  }
}
