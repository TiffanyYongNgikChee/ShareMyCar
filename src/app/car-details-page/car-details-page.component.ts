// Angular core and component lifecycle hook
import { Component, OnInit } from '@angular/core'; // Component decorator and OnInit lifecycle for initialization logic
import { CommonModule } from '@angular/common'; // Common Angular directives like *ngIf, *ngFor
import { IonicModule } from '@ionic/angular'; // Ionic module for using Ionic UI components
import { ActivatedRoute } from '@angular/router'; // Used to read route parameters (e.g., the car ID from the URL)
import { Firestore, doc, getDoc, collection, addDoc } from '@angular/fire/firestore'; // Firebase Firestore functions and types for data access
import { UserService } from '../services/user.service'; // Service to fetch user data (e.g., owner of the car)
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Reactive forms handling and validation
import { register } from 'swiper/element/bundle'; // Registers Swiper.js custom elements for car image sliders or similar UI
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // Allows use of non-standard custom HTML elements in Angular template (required for Swiper)
import { addIcons } from 'ionicons'; // Adds Ionicons to the project for use in templates
// Adds Ionicons to the project for use in templates
import {colorFilterOutline,flashOutline, speedometerOutline,cogOutline,cashOutline,analyticsOutline} from 'ionicons/icons';
import { ToastController } from '@ionic/angular'; // Ionic toast controller to show feedback messages (success/error)

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

  constructor(private route: ActivatedRoute,  // To access the car ID from the URL
    private firestore: Firestore,  // Firestore service to interact with Firebase database
    private userService: UserService, // Custom service to fetch owner (user) data
    private toastController: ToastController,  // To show success or error messages as toast
    private fb: FormBuilder // Used to build and configure the rental form
  ) {
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
      this.carId = this.route.snapshot.paramMap.get('id')!;  // Get car ID from the route parameters
      await this.loadCarDetails(); // Load the car and owner info using the car ID
    }
  
    async loadCarDetails() {
      try {
        // Load car details
        const carRef = doc(this.firestore, `cars/${this.carId}`); // Reference to the car document in Firestore
        const carSnap = await getDoc(carRef); // Fetch the car document snapshot
        
        if (carSnap.exists()) {
          this.car = { id: carSnap.id, ...carSnap.data() }; // Spread document data into `car` object with ID
          
          // Fetch owner's user data using the user service
          this.owner = await this.userService.getUser(this.car.ownerId);
        }
      } catch (error) {
        console.error('Error loading car details:', error); // Log error if fetch fails
      } finally {
        this.isLoading = false; // Stop loading indicator regardless of success/failure
      }
    }
    
    calculateTotal(): number {
      // Return 0 if any required data is missing
      if (!this.car || !this.rentalForm.value.pickupDate || !this.rentalForm.value.dropoffDate) {
        return 0;
      }
      
      // Convert string dates to actual Date objects
      const pickupDate = new Date(this.rentalForm.value.pickupDate);
      const dropoffDate = new Date(this.rentalForm.value.dropoffDate);
      // Calculate difference in time (in milliseconds) and convert to days
      const diffTime = Math.abs(dropoffDate.getTime() - pickupDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      return diffDays * this.car.price_per_day;  // Total price = days × daily rate
    }
  
    async onSubmit() {
      if (this.rentalForm.invalid || this.isSubmitting) return; // Block if form is invalid or already submitting
      
      this.isSubmitting = true; // Prevent duplicate submissions
      
      try {
        const requestData = {
          carId: this.carId,
          carName: this.car.make_model,
          renterId: this.userService.currentUserId, // ID of the person renting the car
          ownerId: this.car.ownerId, // Car owner's ID
          status: 'pending', // Initial status of the request
          createdAt: new Date().toISOString(),  // Timestamp of submission

          ...this.rentalForm.value, // Spread the form data
          totalPrice: this.calculateTotal() // Add calculated price
        };
  
        // Add the request to Firestore
        const requestsRef = collection(this.firestore, 'rentalRequests'); // Get Firestore collection reference
        await addDoc(requestsRef, requestData); // Add rental request to Firestore
  
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
        duration: 3000, // Duration in ms
        position: 'top',  // Top of the screen
        color: 'success', // Green toast
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present(); // Show the toast
    }
  
    private async showErrorToast() {
      const toast = await this.toastController.create({
        message: 'Failed to send request. Please try again.',
        duration: 3000,
        position: 'top',
        color: 'danger', // Red toast
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present(); // Show the toast
    }
  }