import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../main'; // Adjust based on your structure

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
  cars: any[] = []; // Store fetched car data

  constructor() {}

  async ngOnInit() {
    await this.loadCars();
  }

  async loadCars() {
    try {
      const carsCollection = collection(db, 'cars'); // Reference to Firestore collection
      const snapshot = await getDocs(carsCollection);

      this.cars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Fetched Cars:', this.cars);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  }
}