import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '.././services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register-acc',
  templateUrl: './register-acc.component.html',
  imports: [CommonModule, IonicModule, ReactiveFormsModule,RouterModule],
  styleUrls: ['./register-acc.component.scss'],
})
export class RegisterAccComponent {

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
    });
  }

  async register() {
    if (this.registerForm.invalid) {
      this.showToast('Please fill in all fields correctly.');
      return;
    }

    const { username, email, password, phone } = this.registerForm.value;
    const loading = await this.loadingCtrl.create({ message: 'Registering...' });
    await loading.present();

    try {
      await this.authService.register(email, password, username, phone);
      await loading.dismiss();
      this.showToast('Registration successful! Check your email for verification.');
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(error.message || 'Registration failed.');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000, position: 'top' });
    toast.present();
  }
}