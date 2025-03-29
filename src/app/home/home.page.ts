import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../main'; // Adjust based on your structure
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CarService } from '../services/car.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
  cars: any[] = []; // Store fetched car data
  isLoading = true;

  constructor(private authService: AuthService, private router: Router, private carService: CarService,
    private userService: UserService) {}

  async ngOnInit() {
    await this.loadCars();
  }

  async loadCars() {
    this.carService.getAvailableCars().subscribe(async (cars) => {
      // Fetch owner names for each car
      this.cars = await Promise.all(cars.map(async car => {
        const owner = await this.userService.getUser(car.ownerId);
        return {
          ...car,
          ownerName: owner?.username || 'Unknown'
        };
      }));
      this.isLoading = false;
    });
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