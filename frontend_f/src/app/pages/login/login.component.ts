import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-screen">
      <div class="auth-box">
        <div class="auth-logo">
          <span class="moon-icon">🌙</span>
          <span>Sleep Tracker</span>
        </div>

        <div class="auth-tabs">
          <span class="auth-tab active">Login</span>
          <a class="auth-tab" routerLink="/register">Register</a>
        </div>

        <div class="form-group">
          <label>Username</label>
          <input
            type="text"
            [(ngModel)]="username"
            name="username"
            placeholder="Your username"
            (keyup.enter)="onLogin()"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Your password"
            (keyup.enter)="onLogin()"
          />
        </div>

        @if (errorMessage) {
          <div class="error-msg">{{ errorMessage }}</div>
        }

        <button class="btn-auth" (click)="onLogin()" [disabled]="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <p class="auth-hint">Don't have an account? <a routerLink="/register">Register</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gray-50);
    }
    .auth-box {
      background: #fff;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius);
      padding: 36px 32px;
      width: 380px;
      max-width: 95vw;
      box-shadow: var(--shadow-md);
    }
    .auth-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      justify-content: center;
    }
    .moon-icon { font-size: 24px; }
    .auth-logo span:last-child { font-size: 20px; font-weight: 700; color: var(--gray-900); }
    .auth-tabs {
      display: flex;
      background: var(--gray-100);
      border-radius: var(--radius-sm);
      padding: 3px;
      margin-bottom: 24px;
    }
    .auth-tab {
      flex: 1;
      text-align: center;
      padding: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px;
      color: var(--gray-400);
      text-decoration: none;
      transition: all .15s;
    }
    .auth-tab.active { background: #fff; color: var(--gray-900); box-shadow: var(--shadow-sm); }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--gray-500); margin-bottom: 6px; }
    .form-group input {
      width: 100%; padding: 10px 14px;
      border: 1px solid var(--gray-200); border-radius: var(--radius-sm);
      font-family: var(--font); font-size: 14px; color: var(--gray-700);
      outline: none; transition: border-color .15s;
    }
    .form-group input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
    .error-msg { font-size: 13px; color: var(--red); background: var(--red-light); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 12px; }
    .btn-auth {
      width: 100%; padding: 11px; background: var(--blue); color: #fff;
      border: none; border-radius: var(--radius-sm);
      font-family: var(--font); font-size: 14px; font-weight: 600;
      cursor: pointer; margin-top: 6px; transition: all .15s;
    }
    .btn-auth:hover:not(:disabled) { background: #2563eb; }
    .btn-auth:disabled { opacity: .6; cursor: not-allowed; }
    .auth-hint { text-align: center; font-size: 13px; color: var(--gray-400); margin-top: 16px; }
    .auth-hint a { color: var(--blue); text-decoration: none; font-weight: 500; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.errorMessage = '';
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter your username and password.';
      return;
    }
    this.loading = true;
    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }
}
