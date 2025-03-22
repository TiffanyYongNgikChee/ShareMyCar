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
];
