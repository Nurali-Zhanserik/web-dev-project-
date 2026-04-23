import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserInfo } from '../models/sleep.models';
 
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:8000/api/auth';
  private readonly ACCESS_KEY = 'sleep_access';
  private readonly REFRESH_KEY = 'sleep_refresh';
  private readonly USER_KEY = 'sleep_user';
 
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();
 
  constructor(private http: HttpClient, private router: Router) {}
 
  // ── Login ──────────────────────────────────────────────────────────────────
  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login/`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }
 
  // ── Register ───────────────────────────────────────────────────────────────
  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register/`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }
 
  // ── Logout ─────────────────────────────────────────────────────────────────
  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      // Attempt to blacklist token on the server; ignore errors
      this.http.post(`${this.API}/logout/`, { refresh }).subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }
 
  // ── Token helpers ──────────────────────────────────────────────────────────
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }
 
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }
 
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
 
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }
 
  refreshToken(): Observable<{ access: string }> {
    return this.http
      .post<{ access: string }>(`${this.API}/refresh/`, { refresh: this.getRefreshToken() })
      .pipe(tap(res => localStorage.setItem(this.ACCESS_KEY, res.access)));
  }
 
  // ── Private helpers ────────────────────────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.ACCESS_KEY, res.access);
    localStorage.setItem(this.REFRESH_KEY, res.refresh);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
 
  private clearSession(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }
 
  private loadUser(): UserInfo | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
