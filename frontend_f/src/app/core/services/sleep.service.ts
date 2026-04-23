import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  SleepRecord, SleepRecordPayload, SleepStats,
  SleepCategory, ProfileResponse
} from '../models/sleep.models';

@Injectable({ providedIn: 'root' })
export class SleepService {
  private readonly BASE = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // ── Sleep Records (full CRUD) ──────────────────────────────────────────────
  getRecords(): Observable<SleepRecord[]> {
    return this.http.get<SleepRecord[]>(`${this.BASE}/records/`).pipe(
      catchError(this.handleError)
    );
  }

  getRecord(id: number): Observable<SleepRecord> {
    return this.http.get<SleepRecord>(`${this.BASE}/records/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  createRecord(payload: SleepRecordPayload): Observable<SleepRecord> {
    return this.http.post<SleepRecord>(`${this.BASE}/records/`, payload).pipe(
      catchError(this.handleError)
    );
  }

  updateRecord(id: number, payload: Partial<SleepRecordPayload>): Observable<SleepRecord> {
    return this.http.patch<SleepRecord>(`${this.BASE}/records/${id}/`, payload).pipe(
      catchError(this.handleError)
    );
  }

  deleteRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/records/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Statistics ────────────────────────────────────────────────────────────
  getStats(): Observable<SleepStats> {
    return this.http.get<SleepStats>(`${this.BASE}/stats/`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Categories ────────────────────────────────────────────────────────────
  getCategories(): Observable<SleepCategory[]> {
    return this.http.get<SleepCategory[]>(`${this.BASE}/categories/`).pipe(
      catchError(this.handleError)
    );
  }

  createCategory(payload: { name: string; color: string }): Observable<SleepCategory> {
    return this.http.post<SleepCategory>(`${this.BASE}/categories/`, payload).pipe(
      catchError(this.handleError)
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.BASE}/profile/`).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(payload: any): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${this.BASE}/profile/`, payload).pipe(
      catchError(this.handleError)
    );
  }

  // ── Error handler (Requirement: handle API errors gracefully) ─────────────
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred.';
    if (error.status === 0) {
      message = 'Cannot reach the server. Please check your connection.';
    } else if (error.status === 401) {
      message = 'Authentication failed. Token may be missing.';
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error.error && typeof error.error === 'object') {
      const firstKey = Object.keys(error.error)[0];
      if (firstKey) {
        const val = error.error[firstKey];
        message = Array.isArray(val) ? val[0] : val;
      }
    }
    return throwError(() => new Error(message));
  }
}
