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
    path: 'register',
    loadComponent: () => import('./user-register/user-register.component').then((m) => m.UserRegisterComponent),
  },
  {
    path: 'user-register',
    loadComponent: () => import('./register-acc/register-acc.component').then((m) => m.RegisterAccComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'car-register',
    loadComponent: () => import('./car-register/car-register.component').then((m) => m.CarRegisterComponent),
  },
  {
    path: 'owner-car-management',
    loadComponent: () => import('./owner-car-management/owner-car-management.component').then((m) => m.OwnerCarManagementComponent),
  },
  {
    path: 'rider-car-management',
    loadComponent: () => import('./rider-car-management/rider-car-management.component').then((m) => m.RiderCarManagementComponent),
  },
  {
    path: 'car/:id',
    loadComponent: () => import('./car-details-page/car-details-page.component').then((m) => m.CarDetailsPageComponent),
  },
];
