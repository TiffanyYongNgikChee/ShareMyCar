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
    private fb: FormBuilder, // Initializes the car form using FormBuilder.
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
    this.loadGoogleMapsScript(); //Loads the Google Maps API dynamically (if not already loaded).
  }
  // Uses @ViewChild to access native DOM elements.
  ngAfterViewInit() {
    setTimeout(() => { //Waits briefly then sets up Places Autocomplete on the pickup input after the view is initialized.
      this.setupAutocomplete();
    }, 100);
  }

  // Update your onImageSelected method to include proper typing
  onImageSelected(event: Event) {
    //Triggered when a user selects images via the file input.
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) { 
      this.selectedImages = Array.from(input.files); // Converts the selected FileList into a File[].
      this.imagePreviews = [];
      
      // Add proper type casting here
      Array.from(input.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            this.imagePreviews.push(e.target.result as string); // Generates base64 previews for display using FileReader.
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Uploads all selected images to Firebase Storage under a folder named after the user's UID.
  async uploadImages(uid: string): Promise<string[]> {
    const storage = getStorage();
    const uploadPromises = this.selectedImages.map(async (file: File) => {
      const storageRef = ref(storage, `cars/${uid}/${file.name}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    });
    return Promise.all(uploadPromises); // Returns an array of download URLs after successful upload.
  }
    // Modified submit method
    async submitCar() {
      // Validates form and prevents duplicate submissions.
      if (!this.carForm.valid || this.isLoading) return;
      this.isLoading = true;

      try {
        // Gets current user from Firebase Auth.
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        // Upload images if any
        const imageUrls = this.selectedImages.length > 0 
          ? await this.uploadImages(user.uid)
          : [];
        // Prepares a carData object
        const carData = {
          ...this.carForm.value,
          ownerId: user.uid,
          images: imageUrls,
          isAvailable: true,
          createdAt: new Date(),
          licensePlate: '', 
          dailyRate: this.carForm.value.price_per_day // Map to consistent field name
        };
        
        //Adds the data to the Firestore cars collection.
        const carsCollection = collection(db, 'cars');
        await addDoc(carsCollection, carData);
        
        // Navigates the user to the owner-car-management page after successful registration.
        this.router.navigate(['/owner-car-management']);
        
      } catch (error) {
        console.error('Error registering car:', error); // Displays errors in the console if anything goes wrong.
      } finally {
        this.isLoading = false;
      }
    }

    // Dynamically injects the Google Maps JS API script into the page if it's not already present.
    loadGoogleMapsScript() {
      if (!(window as any).google || !(window as any).google.maps) {
        const script = document.createElement('script');
        // Includes the places library for the autocomplete functionality.
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAjjR0-3zkTPmljMueREFtfZjl-Kr-bs6A&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.setupAutocomplete();
        };
        document.head.appendChild(script);
      }
    }
    // Removes an image from both the selected images array and the preview array.
    removeImage(index: number) {
      this.selectedImages.splice(index, 1); // Lets users delete unwanted images before submitting.
      this.imagePreviews.splice(index, 1);
    }

    // Binds Google Places Autocomplete to the pickup input field.
    setupAutocomplete() {
      // When the user selects a location
      const inputElement = this.pickupInput?.nativeElement?.querySelector('input');
      if (!inputElement) {
        console.error('Native input element not found');
        return;
      }

      // Extracts address, latitude, and longitude.
      this.autocomplete = new (window as any).google.maps.places.Autocomplete(
        inputElement, 
        { types: ['geocode'] }
      );
      // Updates the form with these values.
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

        this.initMap(); // // Initializes the map with the selected location.
      });
    }
    // Initializes or updates a Google Map centered on the selected pickup location.
    initMap() {
      if (!this.latitude || !this.longitude) return;

      const location = { lat: this.latitude, lng: this.longitude };

      if (!this.map) {
        this.map = new (window as any).google.maps.Map(document.getElementById('map') as HTMLElement, {
          center: location,
          zoom: 15
        });
      }
      // Places a marker on the map.
      if (this.marker) {
        this.marker.setMap(null);
      }

      this.marker = new (window as any).google.maps.Marker({
        position: location,
        map: this.map
      });
      // Called after a place is selected from autocomplete.
      this.map.setCenter(location);
    }
  }