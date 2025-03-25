import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
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
export class CarRegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('pickupInput', { read: ElementRef }) pickupInput!: ElementRef;

  carForm: FormGroup;
  latitude: number = 0;
  longitude: number = 0;
  map: any;
  marker: any;
  autocomplete: any;

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
      fuel_charge: ['', Validators.min(0)],
      mileage_limit: ['', Validators.min(0)],
      insurance_fee: ['', Validators.min(0)],
      deposit: ['', Validators.min(0)],
      pickup_location: ['', Validators.required],
      image_url: [''],
      latitude: [''], 
      longitude: ['']
    });
  }

  ngOnInit() {
    this.loadGoogleMapsScript();
  }

  ngAfterViewInit() {
    // Slight delay to ensure Ionic input is fully rendered
    setTimeout(() => {
      this.setupAutocomplete();
    }, 100);
  }

  loadGoogleMapsScript() {
    if (!(window as any).google || !(window as any).google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAjjR0-3zkTPmljMueREFtfZjl-Kr-bs6A&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.setupAutocomplete();
      };
      document.head.appendChild(script);
    }
  }

  setupAutocomplete() {
    // For Ionic input, we need to get the native input element
    const inputElement = this.pickupInput?.nativeElement?.querySelector('input');
    
    if (!inputElement) {
      console.error('Native input element not found');
      return;
    }

    console.log('Setting up Autocomplete for Ionic input', inputElement);

    // Create autocomplete instance
    this.autocomplete = new (window as any).google.maps.places.Autocomplete(
      inputElement, 
      { types: ['geocode'] }
    );

    // Add listener for place selection
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      
      if (!place.geometry) {
        console.error('No geometry found for the selected place');
        return;
      }

      // Update latitude and longitude
      this.latitude = place.geometry.location.lat();
      this.longitude = place.geometry.location.lng();

      // Update form values
      this.carForm.patchValue({
        pickup_location: place.formatted_address,
        latitude: this.latitude,
        longitude: this.longitude
      });

      // Initialize or update map
      this.initMap();
    });
  }

  initMap() {
    if (!this.latitude || !this.longitude) return;

    const location = { lat: this.latitude, lng: this.longitude };

    // Create map if it doesn't exist
    if (!this.map) {
      this.map = new (window as any).google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: location,
        zoom: 15
      });
    }

    // Remove existing marker
    if (this.marker) {
      this.marker.setMap(null);
    }

    // Add new marker
    this.marker = new (window as any).google.maps.Marker({
      position: location,
      map: this.map
    });

    // Center the map
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

      // Reset form and map
      this.carForm.reset();
      this.latitude = 0;
      this.longitude = 0;
      this.marker?.setMap(null);
      this.map?.setCenter({ lat: 0, lng: 0 });

    } catch (error) {
      console.error('Error adding car:', error);
    }
  }
}