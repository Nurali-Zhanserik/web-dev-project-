import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SleepService } from '../../core/services/sleep.service';
import { SleepRecord, SleepRecordPayload, SleepStats } from '../../core/models/sleep.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
 
    <div class="card">
      <div class="card-header">
        <div class="card-title">🌙 Add Sleep Record</div>
      </div>

      <div class="form-grid">
       
        <div class="form-group">
          <label>Sleep Time</label>
          <div class="input-wrap">
         <input type="time" [(ngModel)]="form.sleep_time" name="sleepTime" />
         </div>
        </div>

        <div class="form-group">
          <label>Wake Up Time</label>
          <div class="input-wrap">
         <input type="time" [(ngModel)]="form.wake_time" name="wakeTime" />
        </div>
        </div>

        <div class="form-group">
          <label>Quality</label>
          <div class="input-wrap">
            <svg class="input-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <select [(ngModel)]="form.quality" name="quality">
              <option [value]="5">5 - Excellent</option>
              <option [value]="4">4 - Good</option>
              <option [value]="3">3 - Average</option>
              <option [value]="2">2 - Poor</option>
              <option [value]="1">1 - Very Poor</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Notes <span class="optional">(optional)</span></label>
          <div class="input-wrap">
            <textarea [(ngModel)]="form.notes" name="notes" placeholder="How did you sleep?"></textarea>
          </div>
        </div>
      </div>

      <!-- (Requirement: (click) event triggering API request — click 1) -->
      <button class="btn-add" (click)="onAddRecord()" [disabled]="submitting">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ submitting ? 'Adding...' : 'Add Record' }}
      </button>

      <!-- Error display (Requirement: handle API errors gracefully) -->
      @if (addError) {
        <div class="error-banner">{{ addError }}</div>
      }
    </div>

    <!-- Recent Records Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Recent Sleep Records</div>
        <a class="view-all" routerLink="/records">View All</a>
      </div>

      @if (loadingRecords) {
        <div class="loading-msg">Loading records...</div>
      } @else if (recentRecords.length === 0) {
        <div class="empty-state">No records yet. Add your first sleep record above!</div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sleep Time</th>
              <th>Wake Up Time</th>
              <th>Duration</th>
              <th>Quality</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- (Requirement: @for to loop over data) -->
            @for (record of recentRecords; track record.id) {
              <tr>
                <td>{{ record.date | date:'MMM d, yyyy' }}</td>
                <td>{{ formatTime(record.sleep_time) }}</td>
                <td>{{ formatTime(record.wake_time) }}</td>
                <td>{{ record.duration_hours }}</td>
                <td><span class="quality-badge" [ngClass]="qualityClass(record.quality)">{{ record.quality_display }}</span></td>
                <td>
                  <!-- (Requirement: click event 2 — edit) -->
                  <button class="action-btn edit" (click)="onEditRecord(record)" title="Edit">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <!-- (Requirement: click event 3 — delete) -->
                  <button class="action-btn del" (click)="onDeleteRecord(record.id)" title="Delete">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (deleteError) {
        <div class="error-banner">{{ deleteError }}</div>
      }
    </div>

    <!-- Summary Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Summary <span class="subtitle">(This Week)</span></div>
      </div>

      @if (stats) {
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon blue">🕐</div>
            <div>
              <div class="summary-label">Average Duration</div>
              <div class="summary-value">{{ formatMinutes(stats.week_avg_duration_minutes) }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon amber">⭐</div>
            <div>
              <div class="summary-label">Average Quality</div>
              <div class="summary-value">{{ stats.week_avg_quality }} <span>/ 5</span></div>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">Add some records to see your weekly summary.</div>
      }
    </div>

    <!-- Edit Modal -->
    @if (editingRecord) {
      <div class="modal-overlay" (click)="closeEdit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">Edit Sleep Record</div>

          <div class="modal-form-grid">
            <div class="form-group">
              <label>Sleep Time</label>
              <input type="time" [(ngModel)]="editForm.sleep_time" name="editSleep" />
            </div>
            <div class="form-group">
              <label>Wake Up Time</label>
              <input type="time" [(ngModel)]="editForm.wake_time" name="editWake" />
            </div>
            <div class="form-group" style="grid-column: 1 / -1">
              <label>Quality</label>
              <select [(ngModel)]="editForm.quality" name="editQuality">
                <option [value]="5">5 - Excellent</option>
                <option [value]="4">4 - Good</option>
                <option [value]="3">3 - Average</option>
                <option [value]="2">2 - Poor</option>
                <option [value]="1">1 - Very Poor</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1">
              <label>Notes</label>
              <textarea [(ngModel)]="editForm.notes" name="editNotes" placeholder="Optional notes..."></textarea>
            </div>
          </div>

          @if (editError) {
            <div class="error-banner">{{ editError }}</div>
          }

          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeEdit()">Cancel</button>
            <!-- (Requirement: click event 4 — save edit) -->
            <button class="btn-save" (click)="onSaveEdit()" [disabled]="editSubmitting">
              {{ editSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toast) {
      <div class="toast">{{ toast }}</div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  // Form model — ngModel bindings
  form: SleepRecordPayload = {
    date: new Date().toISOString().slice(0, 10),
    sleep_time: '23:30',
    wake_time: '07:15',
    quality: 4,
    notes: '',
  };

  editForm: Partial<SleepRecordPayload> = {};
  editingRecord: SleepRecord | null = null;

  recentRecords: SleepRecord[] = [];
  stats: SleepStats | null = null;

  loadingRecords = false;
  submitting = false;
  editSubmitting = false;

  addError = '';
  deleteError = '';
  editError = '';
  toast = '';

  constructor(private sleepService: SleepService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadingRecords = true;
    this.sleepService.getRecords().subscribe({
      next: (records) => {
        this.recentRecords = records.slice(0, 4);
        this.loadingRecords = false;
      },
      error: (err: Error) => {
        this.addError = err.message;
        this.loadingRecords = false;
      }
    });

    this.sleepService.getStats().subscribe({
      next: (s) => (this.stats = s.total_records > 0 ? s : null),
      error: () => {}
    });
  }

  onAddRecord(): void {
    this.addError = '';
    this.form.date = new Date().toISOString().slice(0, 10);
    this.submitting = true;
    this.sleepService.createRecord(this.form).subscribe({
      next: () => {
        this.form.notes = '';
        this.showToast('Sleep record added!');
        this.loadData();
        this.submitting = false;
      },
      error: (err: Error) => {
        this.addError = err.message;
        this.submitting = false;
      }
    });
  }

  onEditRecord(record: SleepRecord): void {
    this.editingRecord = record;
    this.editForm = {
      sleep_time: record.sleep_time,
      wake_time: record.wake_time,
      quality: record.quality,
      notes: record.notes,
    };
    this.editError = '';
  }

  onSaveEdit(): void {
    if (!this.editingRecord) return;
    this.editError = '';
    this.editSubmitting = true;
    this.sleepService.updateRecord(this.editingRecord.id, this.editForm).subscribe({
      next: () => {
        this.closeEdit();
        this.showToast('Record updated!');
        this.loadData();
        this.editSubmitting = false;
      },
      error: (err: Error) => {
        this.editError = err.message;
        this.editSubmitting = false;
      }
    });
  }

  onDeleteRecord(id: number): void {
    this.deleteError = '';
    this.sleepService.deleteRecord(id).subscribe({
      next: () => {
        this.showToast('Record deleted.');
        this.loadData();
      },
      error: (err: Error) => {
        this.deleteError = err.message;
      }
    });
  }

  closeEdit(): void {
    this.editingRecord = null;
  }

  // Helpers
  formatTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  formatMinutes(mins: number): string {
    if (!mins) return '—';
    return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  }

  qualityClass(q: number): string {
    const map: Record<number, string> = { 5: 'q-excellent', 4: 'q-good', 3: 'q-average', 2: 'q-poor', 1: 'q-poor' };
    return map[q] ?? 'q-average';
  }

  showToast(msg: string): void {
    this.toast = msg;
    setTimeout(() => (this.toast = ''), 2500);
  }
}
