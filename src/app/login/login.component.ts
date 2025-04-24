// Import Angular core and form tools
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Import custom AuthService for authentication logic
import { AuthService } from '../services/auth.service'; 
// Angular Router for navigation
import { Router } from '@angular/router';
// Common Angular/Ionic modules
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, IonicModule,ReactiveFormsModule,RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private loadingCtrl: LoadingController) {
    this.loginForm = this.fb.group({ // Define the structure of the login form 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
  // Method triggered when user submits the login form
  async login() {
    if (this.loginForm.valid) {
      // Show a loading spinner while login request is processing
      const loading = await this.loadingCtrl.create({
        message: 'Logging in...',
        spinner: 'crescent',
        duration: 5000, // Auto-dismiss after 5 seconds in case of no response
      });

      await loading.present();
      // Destructure email and password from form values
      const { email, password } = this.loginForm.value;
      try {
        await this.authService.login(email, password);
        await loading.dismiss(); // Ensure loading is dismissed before navigation
        this.router.navigate(['/home']);
      } catch (error) {
        await loading.dismiss(); // Dismiss loading spinner after successful login
      }
    }
  }
}