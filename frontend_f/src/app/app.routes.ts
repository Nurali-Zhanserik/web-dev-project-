import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'records',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/records/records.component').then(m => m.RecordsComponent)
  },
  {
    path: 'statistics',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/statistics/statistics.component').then(m => m.StatisticsComponent)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },

  { path: '**', redirectTo: 'dashboard' }
];
