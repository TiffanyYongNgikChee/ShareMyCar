// Angular core and common modules
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For two-way data binding
import { IonicModule } from '@ionic/angular'; // Ionic components for mobile

// Firebase and services
import { AuthService } from '../services/auth.service';// Auth handling
import { Router } from '@angular/router'; // Navigation
import { CarService } from '../services/car.service';  // Handles car data
import { UserService } from '../services/user.service'; // Gets user details
import { RouterModule } from '@angular/router';
// Icon imports
import {
  personCircleOutline,
  personCircle,
  filterOutline,
  searchOutline,
  locationOutline,
  peopleOutline,
  speedometerOutline,
  flashOutline,
  filter,
  fileTray,
  home,
  chatbubbleEllipses,
  bicycle,
  cash,
  diamond,
  carSport,
  sunny,
  navigate,
  thermometer,
  camera,
  key,
  logoApple,
  logoAndroid,
  star,
  chevronDown,
  options,
  arrowForward,
  flash,
  carSportOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons'; // Manually registering used icons for performance

@Component({
  selector: 'app-home',
  standalone: true, // Angular 14+ standalone component
  imports: [CommonModule, IonicModule, RouterModule, FormsModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
  cars: any[] = []; // Consider defining a Car interface
  filteredCars: any[] = [];
  featuredCars: any[] = [];
  isLoading = true;
  allCars: any[] = [];
  
  // Filter properties
  searchQuery = '';
  priceRange = { lower: 0, upper: 500 };
  sortOption = 'price-low';
  selectedCarTypes: string[] = [];
  selectedTransmission = '';
  selectedFuelType = '';
  showFilters = false;

  // Car category selection
  carCategories = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Van'];
  selectedCategory = 'All';

  // Location properties
  currentLocation = 'New York';
  showLocationPicker = false;

  // Quick filters for UI shortcuts
  quickFilters = [
    { label: 'All', value: 'all', icon: '' },
    { label: 'Economy', value: 'economy', icon: 'cash' },
    { label: 'Luxury', value: 'luxury', icon: 'diamond' },
    { label: 'Electric', value: 'electric', icon: 'flash' },
    { label: 'SUVs', value: 'suv', icon: 'car-sport' },
    { label: 'Convertible', value: 'convertible', icon: 'sunny' }
  ];
  activeQuickFilter = 'all';

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private carService: CarService,
    private userService: UserService
  ) {
    // Register icons to be used in the template
    addIcons({
      personCircleOutline,
      personCircle,
      filterOutline,
      searchOutline,
      locationOutline,
      peopleOutline,
      speedometerOutline,
      flashOutline,
      filter,
      home,
      chatbubbleEllipses,
      bicycle,
      cash,
      diamond,
      carSport,
      sunny,
      navigate,
      thermometer,
      camera,
      key,
      logoApple,
      logoAndroid,
      star,
      chevronDown,
      options,
      arrowForward,
      flash,
      carSportOutline
    });
  }

  async ngOnInit() {
    await this.loadCars(); // Load cars on init
  }
  
  private matchesSearchQuery(car: any): boolean {
    if (!this.searchQuery) return true;
    const query = this.searchQuery.toLowerCase();
    return (
      car.make_model.toLowerCase().includes(query) ||
      car.pickup_location.toLowerCase().includes(query)
    );
  }
  
  private matchesOtherFilters(car: any): boolean {
    return (
      car.price_per_day >= this.priceRange.lower &&
      car.price_per_day <= this.priceRange.upper &&
      (this.selectedCarTypes.length === 0 || this.selectedCarTypes.includes(car.car_type)) &&
      (!this.selectedTransmission || car.transmission === this.selectedTransmission) &&
      (!this.selectedFuelType || car.fuel_type === this.selectedFuelType)
    );
  }
  
  async loadCars() {
    this.carService.getAvailableCars().subscribe(async (cars) => {
      this.cars = await Promise.all(cars.map(async car => {
        const owner = await this.userService.getUser(car.ownerId);
        return {
          ...car,
          ownerName: owner?.username || 'Private Owner',
          price_per_day: car.price_per_day || 0,
          car_type: car.car_type || '',
          transmission: car.transmission || '',
          fuel_type: car.fuel_type || '',
          pickup_location: car.pickup_location || '',
          rating: car.rating || (4 + Math.random()).toFixed(1), // Default rating if none exists
          features: car.features || []
        };
      }));
      this.allCars = [...this.cars]; // Store original unfiltered list
      this.filteredCars = [...this.cars];
      this.updateFeaturedCars();
      this.isLoading = false;
    });
  }

  // Add this method to filter cars by category
  getCarsByCategory(category: string): any[] {
    return this.filteredCars.filter(car => car.car_type === category).slice(0, 5);
  }

  // Add this method to handle category changes
  filterByCategory() {
    if (this.selectedCategory === 'All') {
      this.applyFilters();
    } else {
      this.filteredCars = this.allCars.filter(car => 
        car.car_type === this.selectedCategory && 
        this.matchesSearchQuery(car) && 
        this.matchesOtherFilters(car)
      );
    }
  }

  // Add this method to view all cars in a category
  viewAllCategory(category: string) {
    this.selectedCategory = category;
    this.filterByCategory();
  }

  updateFeaturedCars() {
    // Get top rated cars or cars marked as featured
    this.featuredCars = [...this.cars]
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 5);
  }

  setQuickFilter(filter: string) {
    this.activeQuickFilter = filter;
    
    if (filter === 'all') {
      this.resetFilters();
      return;
    }
    
    // Reset other filters
    this.searchQuery = '';
    this.selectedCarTypes = [];
    this.selectedTransmission = '';
    this.selectedFuelType = '';
    
    // Apply quick filter
    switch(filter) {
      case 'sedan':
        this.priceRange = { lower: 0, upper: 50 };
        break;
      case 'diesel':
        this.priceRange = { lower: 100, upper: 500 };
        this.selectedCarTypes = ['Luxury', 'Premium'];
        break;
      case 'electric':
        this.selectedFuelType = 'Electric';
        break;
      case 'suv':
        this.selectedCarTypes = ['SUV'];
        break;
      case 'convertible':
        this.selectedCarTypes = ['Convertible'];
        break;
    }
    
    this.applyFilters();
  }

  getFeatureIcon(feature: string): string {
    const icons: {[key: string]: string} = {
      'Bluetooth': 'bluetooth',
      'GPS': 'navigate',
      'Heated Seats': 'thermometer',
      'Sunroof': 'sunny',
      'Backup Camera': 'camera',
      'Keyless Entry': 'key',
      'Apple CarPlay': 'logo-apple',
      'Android Auto': 'logo-android',
      'Economy': 'cash',
      'Luxury': 'diamond',
      'SUV': 'car-sport',
      'Convertible': 'sunny'
    };
    
    return icons[feature] || '';
  }

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
    this.activeQuickFilter = 'all';
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

  goToMessages() {
    this.router.navigate(['/message']);
  }

  bookNow() {
    // You can implement a default booking action or navigate to a featured car
    if (this.featuredCars.length > 0) {
      this.router.navigate(['/car', this.featuredCars[0].id]);
    }
  }

  toggleLocationPicker() {
    this.showLocationPicker = !this.showLocationPicker;
  }

  changeLocation(location: string) {
    this.currentLocation = location;
    this.showLocationPicker = false;
  }

  signUpPage(){
    this.router.navigate(['/login']);
  }
}