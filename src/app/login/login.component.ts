import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service'; // Ensure path is correct
import { Router } from '@angular/router';
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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async login() {
    if (this.loginForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Logging in...',
        spinner: 'crescent',
        duration: 5000, // Timeout to prevent infinite loading
      });

      await loading.present();

      const { email, password } = this.loginForm.value;
      try {
        await this.authService.login(email, password);
        await loading.dismiss(); // Ensure loading is dismissed before navigation
        this.router.navigate(['/home']);
      } catch (error) {
        await loading.dismiss(); // Dismiss loading if login fail
      }
    }
  }
}