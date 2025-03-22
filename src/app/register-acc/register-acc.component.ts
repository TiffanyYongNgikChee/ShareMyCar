import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { db } from '../../main'; // Adjust path to your db export
import { collection, addDoc } from 'firebase/firestore';


@Component({
  selector: 'app-register-acc',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './register-acc.component.html',
  styleUrls: ['./register-acc.component.scss'],
})
export class RegisterAccComponent {

  userForm: FormGroup;
  showToast = false;
  
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });
  }
  
  async submitForm() {
    if (!this.userForm.valid) return;
    
    try {
      const usersCollection = collection(db, 'users');
      const userData = {
        ...this.userForm.value,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(usersCollection, userData);
      console.log('User added with ID:', docRef.id);
      
      // Reset form and show success message
      this.userForm.reset();
      this.showToast = true;
    } catch (error) {
      console.error('Error adding user:', error);
      // You could add error handling here (show error toast, etc.)
    }
  }
}