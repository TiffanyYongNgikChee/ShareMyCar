import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { db } from '../../main'; // Adjust based on your structure
import { collection, addDoc } from 'firebase/firestore';

declare var google: any; // Ensure Google Maps is available

@Component({
  selector: 'app-car-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './car-register.component.html',
  styleUrls: ['./car-register.component.scss'],
})
export class CarRegisterComponent implements AfterViewInit {
  @ViewChild('pickupInput', { static: false }) pickupInput!: ElementRef;

  carForm: FormGroup;
  latitude: number = 0;
  longitude: number = 0;
  map: any;
  marker: any;

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
      image_url: [''], // Allow users to input a car image URL
      latitude: [''], 
      longitude: ['']
    });
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure that the input field is available before initializing the autocomplete.
    setTimeout(() => {
      this.loadGoogleMapsApi();
    }, 1000); // Delay slightly to ensure element is available
  }

  loadGoogleMapsApi() {
    // Check if google is already defined, otherwise load the script
    if (typeof google === 'undefined' || !google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAjjR0-3zkTPmljMueREFtfZjl-Kr-bs6A&libraries=places`; // Replace with your actual API key
      script.async = true;
      script.onload = () => {
        this.loadGoogleMapsAutocomplete();
      };
      document.head.appendChild(script);
    } else {
      this.loadGoogleMapsAutocomplete();
    }
  }

  loadGoogleMapsAutocomplete() {
    if (!this.pickupInput || !this.pickupInput.nativeElement) {
      console.error('Pickup input element not found');
      return;
    }

    // Initialize the Autocomplete object for the input field
    const autocomplete = new google.maps.places.Autocomplete(this.pickupInput.nativeElement);

    // Listen for the place change event and update the form with latitude and longitude
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();
        this.carForm.patchValue({ latitude: this.latitude, longitude: this.longitude });

        // Update the map to reflect the new location
        this.initMap();
      } else {
        console.error('No geometry found for the selected place.');
      }
    });
  }

  initMap() {
    if (!this.latitude || !this.longitude) return;

    const location = { lat: this.latitude, lng: this.longitude };

    if (!this.map) {
      this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: location,
        zoom: 15
      });
    }

    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new google.maps.Marker({
      position: location,
      map: this.map
    });

    this.map.setCenter(location);
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

      // Reset form and marker
      this.carForm.reset();
      this.latitude = 0;
      this.longitude = 0;
      this.marker?.setMap(null);  // Remove the existing marker
      this.map?.setCenter({ lat: 0, lng: 0 });  // Reset the map center

    } catch (error) {
      console.error('Error adding car:', error);
    }
  }
}
