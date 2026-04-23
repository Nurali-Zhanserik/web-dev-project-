import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SleepService } from '../../core/services/sleep.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileResponse } from '../../core/models/sleep.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">

      <!-- Profile Info -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Profile</div>
        </div>

        @if (loading) {
          <div class="loading-msg">Loading profile...</div>
        } @else if (profileData) {
          <div class="profile-header">
            <div class="profile-avatar">🌙</div>
            <div>
              <div class="profile-name">{{ profileData.profile.username | titlecase }}</div>
              <div class="profile-email">{{ profileData.profile.email }}</div>
            </div>
          </div>

          <div class="profile-rows">
            <div class="profile-row">
              <span class="row-label">Username</span>
              <span class="row-val">{{ profileData.profile.username }}</span>
            </div>
            <div class="profile-row">
              <span class="row-label">Timezone</span>
              <input type="text" class="inline-input" [(ngModel)]="editBio" name="tz" placeholder="UTC" />
            </div>
            <div class="profile-row">
              <span class="row-label">Bio</span>
              <textarea class="inline-textarea" [(ngModel)]="editBio" name="bio" placeholder="Tell us about yourself..."></textarea>
            </div>
            <div class="profile-row">
              <span class="row-label">Member since</span>
              <span class="row-val">{{ profileData.profile.created_at | date:'MMM yyyy' }}</span>
            </div>
          </div>

          <button class="btn-save-profile" (click)="saveProfile()" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Profile' }}
          </button>

          @if (profileError) {
            <div class="error-banner" style="margin-top: 12px">{{ profileError }}</div>
          }
          @if (profileSuccess) {
            <div class="success-banner">Profile updated!</div>
          }
        }
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Sleep Goal</div>
        </div>

        @if (profileData) {
          <div class="form-group">
            <label>Target duration (hours)</label>
            <input type="number" [(ngModel)]="goalHours" name="goalHours" min="4" max="12" step="0.5" />
          </div>

          <div class="form-group">
            <label>Target quality</label>
            <select [(ngModel)]="goalQuality" name="goalQuality">
              <option [value]="5">5 - Excellent</option>
              <option [value]="4">4 - Good</option>
              <option [value]="3">3 - Average</option>
            </select>
          </div>

          <div class="form-group">
            <label>Target bedtime</label>
            <input type="time" [(ngModel)]="goalBedtime" name="goalBedtime" />
          </div>

          <div class="goal-current">
            <div class="goal-row">
              <span>Current target</span>
              <span class="goal-val">{{ profileData.goal.target_duration_hours }} · Quality {{ profileData.goal.target_quality }}/5</span>
            </div>
          </div>

          <button class="btn-save-profile" (click)="saveGoal()" [disabled]="savingGoal">
            {{ savingGoal ? 'Saving...' : 'Save Goal' }}
          </button>

          @if (goalError) {
            <div class="error-banner" style="margin-top:12px">{{ goalError }}</div>
          }
          @if (goalSuccess) {
            <div class="success-banner">Goal updated!</div>
          }
        }
      </div>

    </div>

    @if (toast) {
      <div class="toast">{{ toast }}</div>
    }
  `,
  styles: [`
    .profile-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .profile-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--blue-light); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
    .profile-name { font-size: 17px; font-weight: 700; color: var(--gray-900); }
    .profile-email { font-size: 13px; color: var(--gray-400); margin-top: 2px; }
    .profile-rows { border-top: 1px solid var(--gray-100); }
    .profile-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--gray-50); }
    .row-label { font-size: 13px; color: var(--gray-500); min-width: 100px; padding-top: 2px; }
    .row-val { font-size: 13px; font-weight: 600; color: var(--gray-900); }
    .inline-input { border: 1px solid var(--gray-200); border-radius: 6px; padding: 5px 10px; font-size: 13px; font-family: var(--font); color: var(--gray-700); outline: none; width: 160px; }
    .inline-textarea { border: 1px solid var(--gray-200); border-radius: 6px; padding: 5px 10px; font-size: 13px; font-family: var(--font); color: var(--gray-700); outline: none; width: 160px; resize: none; height: 56px; }
    .inline-input:focus, .inline-textarea:focus { border-color: var(--blue); }
    .btn-save-profile { width: 100%; margin-top: 16px; padding: 10px; background: var(--blue); color: #fff; border: none; border-radius: var(--radius-sm); font-family: var(--font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .btn-save-profile:hover:not(:disabled) { background: #2563eb; }
    .btn-save-profile:disabled { opacity: .6; cursor: not-allowed; }
    .success-banner { font-size: 13px; color: var(--green); background: var(--green-light); padding: 10px 14px; border-radius: var(--radius-sm); margin-top: 12px; }
    .goal-current { background: var(--gray-50); border-radius: var(--radius-sm); padding: 12px 16px; margin-top: 4px; margin-bottom: 4px; }
    .goal-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--gray-500); }
    .goal-val { font-weight: 600; color: var(--gray-900); }
  `]
})
export class ProfileComponent implements OnInit {
  profileData: ProfileResponse | null = null;
  editBio = '';
  editTimezone = 'UTC';
  goalHours = 8;
  goalQuality = 4;
  goalBedtime = '23:00';

  loading = false;
  saving = false;
  savingGoal = false;
  profileError = '';
  profileSuccess = false;
  goalError = '';
  goalSuccess = false;
  toast = '';

  constructor(private sleepService: SleepService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loading = true;
    this.sleepService.getProfile().subscribe({
      next: (data) => {
        this.profileData = data;
        this.editBio = data.profile.bio;
        this.editTimezone = data.profile.timezone;
        this.goalHours = data.goal.target_duration_minutes / 60;
        this.goalQuality = data.goal.target_quality;
        this.goalBedtime = data.goal.target_bedtime ?? '23:00';
        this.loading = false;
      },
      error: (err: Error) => { this.profileError = err.message; this.loading = false; }
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.profileError = '';
    this.profileSuccess = false;
    this.sleepService.updateProfile({
      profile: { bio: this.editBio, timezone: this.editTimezone }
    }).subscribe({
      next: (data) => {
        this.profileData = data;
        this.profileSuccess = true;
        this.saving = false;
        setTimeout(() => (this.profileSuccess = false), 3000);
      },
      error: (err: Error) => { this.profileError = err.message; this.saving = false; }
    });
  }

  saveGoal(): void {
    this.savingGoal = true;
    this.goalError = '';
    this.goalSuccess = false;
    this.sleepService.updateProfile({
      goal: {
        target_duration_minutes: Math.round(this.goalHours * 60),
        target_quality: this.goalQuality,
        target_bedtime: this.goalBedtime,
      }
    }).subscribe({
      next: (data) => {
        this.profileData = data;
        this.goalSuccess = true;
        this.savingGoal = false;
        setTimeout(() => (this.goalSuccess = false), 3000);
      },
      error: (err: Error) => { this.goalError = err.message; this.savingGoal = false; }
    });
  }
}
