// car.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  constructor(private firestore: Firestore) {}

  getAvailableCars(): Observable<any[]> {
    const carsRef = collection(this.firestore, 'cars');
    const q = query(carsRef);
    return collectionData(q, { idField: 'id' });
  }
}