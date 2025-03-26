import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [CommonModule, IonicModule,ReactiveFormsModule],
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  user: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']); // Redirect if not logged in
    }
  }

  async logout() {
    await this.authService.logout();
  }
}
