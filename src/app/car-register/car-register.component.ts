import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { db, auth } from '../../main'; // Make sure auth is exported from main.ts
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {images,settings,checkmarkCircle,cash,informationCircle,cloudUpload,camera,navigate} from 'ionicons/icons';

@Component({
  selector: 'app-car-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './car-register.component.html',
  styleUrls: ['./car-register.component.scss'],
})
export class CarRegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('pickupInput', { read: ElementRef }) pickupInput!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  carForm: FormGroup;
  latitude: number = 0;
  longitude: number = 0;
  map: any;
  marker: any;
  autocomplete: any;
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.carForm = this.fb.group({
      make_model: ['', Validators.required],
      car_type: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]],
      color: [''],
      transmission: [''],
      seats: ['', Validators.min(1)],
      fuel_type: [''],
      engine: [''],
      price_per_day: ['', Validators.min(0)], // Changed to just daily rate
      mileage_limit: ['', Validators.min(0)],
      pickup_location: ['', Validators.required],
      latitude: [''],
      longitude: [''],
      features: [[]] // Added features array
    });

    addIcons({
      images,
      settings,
      checkmarkCircle,
      cash,
      informationCircle,
      camera,
      navigate,
      cloudUpload
      });
  }

  ngOnInit() {
    this.loadGoogleMapsScript();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupAutocomplete();
    }, 100);
  }

  // Update your onImageSelected method to include proper typing
onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedImages = Array.from(input.files);
    this.imagePreviews = [];
    
    // Add proper type casting here
    Array.from(input.files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.imagePreviews.push(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

// Update your uploadImages method with proper typing
async uploadImages(uid: string): Promise<string[]> {
  const storage = getStorage();
  const uploadPromises = this.selectedImages.map(async (file: File) => {
    const storageRef = ref(storage, `cars/${uid}/${file.name}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  });
  return Promise.all(uploadPromises);
}
  // Modified submit method
  async submitCar() {
    if (!this.carForm.valid || this.isLoading) return;
    this.isLoading = true;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Upload images if any
      const imageUrls = this.selectedImages.length > 0 
        ? await this.uploadImages(user.uid)
        : [];

      const carData = {
        ...this.carForm.value,
        ownerId: user.uid,
        images: imageUrls,
        isAvailable: true,
        createdAt: new Date(),
        licensePlate: '', // Add this field if needed
        dailyRate: this.carForm.value.price_per_day // Map to consistent field name
      };

      const carsCollection = collection(db, 'cars');
      await addDoc(carsCollection, carData);
      
      this.router.navigate(['/owner-car-management']);
      
    } catch (error) {
      console.error('Error registering car:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Keep your existing Google Maps methods
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

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  setupAutocomplete() {
    const inputElement = this.pickupInput?.nativeElement?.querySelector('input');
    if (!inputElement) {
      console.error('Native input element not found');
      return;
    }

    this.autocomplete = new (window as any).google.maps.places.Autocomplete(
      inputElement, 
      { types: ['geocode'] }
    );

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      
      if (!place.geometry) {
        console.error('No geometry found for the selected place');
        return;
      }

      this.latitude = place.geometry.location.lat();
      this.longitude = place.geometry.location.lng();

      this.carForm.patchValue({
        pickup_location: place.formatted_address,
        latitude: this.latitude,
        longitude: this.longitude
      });

      this.initMap();
    });
  }

  initMap() {
    if (!this.latitude || !this.longitude) return;

    const location = { lat: this.latitude, lng: this.longitude };

    if (!this.map) {
      this.map = new (window as any).google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: location,
        zoom: 15
      });
    }

    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new (window as any).google.maps.Marker({
      position: location,
      map: this.map
    });

    this.map.setCenter(location);
  }
}