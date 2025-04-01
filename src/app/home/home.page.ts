import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../main'; // Adjust based on your structure
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CarService } from '../services/car.service';
import { UserService } from '../services/user.service';
import { RouterModule } from '@angular/router';
import {
  personCircleOutline,
  personCircle,
  filterOutline,
  searchOutline,
  locationOutline,
  peopleOutline,
  speedometerOutline,
  flashOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule,RouterModule, FormsModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
  cars: any[] = []; 
  filteredCars: any[] = [];
  isLoading = true;
  
  // Filter properties
  searchQuery = '';
  priceRange = { lower: 0, upper: 500 };
  sortOption = 'price-low';
  selectedCarTypes: string[] = [];
  selectedTransmission = '';
  selectedFuelType = '';
  showFilters = false;

  constructor(private authService: AuthService, private router: Router, private carService: CarService,
    private userService: UserService) {
      addIcons({
          personCircleOutline,
          personCircle,
          filterOutline,
          searchOutline,
          locationOutline,
          peopleOutline,
          speedometerOutline,
          flashOutline
      });
    }

  async ngOnInit() {
    await this.loadCars();
  }

  async loadCars() {
    this.carService.getAvailableCars().subscribe(async (cars) => {
      this.cars = await Promise.all(cars.map(async car => {
        const owner = await this.userService.getUser(car.ownerId);
        return {
          ...car,
          ownerName: owner?.username || 'Private Owner',
          // Ensure these fields exist for filtering
          price_per_day: car.price_per_day || 0,
          car_type: car.car_type || '',
          transmission: car.transmission || '',
          fuel_type: car.fuel_type || '',
          pickup_location: car.pickup_location || ''
        };
      }));
      
      this.filteredCars = [...this.cars];
      this.isLoading = false;
    });
  }
  // Filtering methods
  applyFilters() {
    this.filteredCars = [...this.cars];
    
    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      this.filteredCars = this.filteredCars.filter(car =>
        car.make_model.toLowerCase().includes(query) ||
        car.pickup_location.toLowerCase().includes(query)
      );
    }
    
    // Price range filter
    this.filteredCars = this.filteredCars.filter(car =>
      car.price_per_day >= this.priceRange.lower &&
      car.price_per_day <= this.priceRange.upper
    );
    
    // Car type filter
    if (this.selectedCarTypes.length > 0) {
      this.filteredCars = this.filteredCars.filter(car =>
        this.selectedCarTypes.includes(car.car_type)
      );
    }
    
    // Transmission filter
    if (this.selectedTransmission) {
      this.filteredCars = this.filteredCars.filter(car =>
        car.transmission === this.selectedTransmission
      );
    }
    
    // Fuel type filter
    if (this.selectedFuelType) {
      this.filteredCars = this.filteredCars.filter(car =>
        car.fuel_type === this.selectedFuelType
      );
    }
    
    // Apply sorting
    this.sortCars();
  }

  sortCars() {
    switch (this.sortOption) {
      case 'price-high':
        this.filteredCars.sort((a, b) => b.price_per_day - a.price_per_day);
        break;
      case 'price-low':
        this.filteredCars.sort((a, b) => a.price_per_day - b.price_per_day);
        break;
      case 'newest':
        this.filteredCars.sort((a, b) => b.year - a.year);
        break;
      default:
        this.filteredCars.sort((a, b) => a.price_per_day - b.price_per_day);
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.priceRange = { lower: 0, upper: 500 };
    this.sortOption = 'price-low';
    this.selectedCarTypes = [];
    this.selectedTransmission = '';
    this.selectedFuelType = '';
    this.applyFilters();
  }

  openFilters() {
    this.showFilters = true;
  }

  async goToProfile() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  async goToDetails(){
    this.router.navigate(['/details']);
  }

}