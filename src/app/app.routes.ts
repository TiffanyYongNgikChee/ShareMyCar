import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'user-register',
    loadComponent: () => import('./user-register/user-register.component').then((m) => m.UserRegisterComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register-acc/register-acc.component').then((m) => m.RegisterAccComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'car-register',
    loadComponent: () => import('./car-register/car-register.component').then((m) => m.CarRegisterComponent),
  },
];
