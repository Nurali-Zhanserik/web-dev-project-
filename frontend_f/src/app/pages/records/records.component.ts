import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SleepService } from '../../core/services/sleep.service';
import { SleepRecord, SleepRecordPayload } from '../../core/models/sleep.models';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <div class="card-title">All Sleep Records</div>
        <!-- (click) event → load records -->
        <button class="btn-refresh" (click)="loadRecords()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      @if (loading) {
        <div class="loading-msg">Loading records...</div>
      }

      <!-- (Requirement: @if conditional rendering) -->
      @if (!loading && records.length === 0) {
        <div class="empty-state">No sleep records found. Go to Dashboard to add your first record.</div>
      }

      @if (!loading && records.length > 0) {
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sleep Time</th>
              <th>Wake Up Time</th>
              <th>Duration</th>
              <th>Quality</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- (Requirement: @for loop over API data) -->
            @for (record of records; track record.id) {
              <tr>
                <td>{{ record.date | date:'MMM d, yyyy' }}</td>
                <td>{{ formatTime(record.sleep_time) }}</td>
                <td>{{ formatTime(record.wake_time) }}</td>
                <td>{{ record.duration_hours }}</td>
                <td>
                  <span class="quality-badge" [ngClass]="qualityClass(record.quality)">
                    {{ record.quality_display }}
                  </span>
                </td>
                <td class="notes-cell">{{ record.notes || '—' }}</td>
                <td>
                  <button class="action-btn edit" (click)="openEdit(record)" title="Edit">
                    <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn del" (click)="deleteRecord(record.id)" title="Delete">
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

      @if (error) {
        <div class="error-banner">{{ error }}</div>
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
            <button class="btn-save" (click)="saveEdit()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (toast) {
      <div class="toast">{{ toast }}</div>
    }
  `,
  styles: [`
    .btn-refresh {
      display: flex; align-items: center; gap: 6px; padding: 7px 14px;
      border: 1px solid var(--gray-200); background: #fff; border-radius: var(--radius-sm);
      font-family: var(--font); font-size: 13px; font-weight: 500; color: var(--gray-600); cursor: pointer;
      transition: all .15s;
    }
    .btn-refresh:hover { border-color: var(--blue); color: var(--blue); }
    .notes-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gray-400); }
  `]
})
export class RecordsComponent implements OnInit {
  records: SleepRecord[] = [];
  editingRecord: SleepRecord | null = null;
  editForm: Partial<SleepRecordPayload> = {};

  loading = false;
  saving = false;
  error = '';
  editError = '';
  toast = '';

  constructor(private sleepService: SleepService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.error = '';
    this.sleepService.getRecords().subscribe({
      next: (r) => { this.records = r; this.loading = false; },
      error: (err: Error) => { this.error = err.message; this.loading = false; }
    });
  }

  openEdit(record: SleepRecord): void {
    this.editingRecord = record;
    this.editForm = {
      sleep_time: record.sleep_time,
      wake_time: record.wake_time,
      quality: record.quality,
      notes: record.notes,
    };
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.editingRecord) return;
    this.saving = true;
    this.editError = '';
    this.sleepService.updateRecord(this.editingRecord.id, this.editForm).subscribe({
      next: () => {
        this.closeEdit();
        this.showToast('Record updated!');
        this.loadRecords();
        this.saving = false;
      },
      error: (err: Error) => { this.editError = err.message; this.saving = false; }
    });
  }

  deleteRecord(id: number): void {
    this.error = '';
    this.sleepService.deleteRecord(id).subscribe({
      next: () => { this.showToast('Record deleted.'); this.loadRecords(); },
      error: (err: Error) => { this.error = err.message; }
    });
  }

  closeEdit(): void { this.editingRecord = null; }

  formatTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  qualityClass(q: number): string {
    const map: Record<number, string> = { 5: 'q-excellent', 4: 'q-good', 3: 'q-average', 2: 'q-poor', 1: 'q-poor' };
    return map[q] ?? 'q-average';
  }

  showToast(msg: string): void { this.toast = msg; setTimeout(() => (this.toast = ''), 2500); }
}
