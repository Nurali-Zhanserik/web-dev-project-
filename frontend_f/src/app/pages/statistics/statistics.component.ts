import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SleepService } from '../../core/services/sleep.service';
import { SleepStats, SleepRecord } from '../../core/models/sleep.models';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Stat Cards -->
    @if (stats) {
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">{{ stats.total_records }}</div>
          <div class="stat-lbl">Total Records</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ formatMinutes(stats.avg_duration_minutes) }}</div>
          <div class="stat-lbl">Avg Duration</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ stats.avg_quality }}<span style="font-size:14px;color:var(--gray-400)">/5</span></div>
          <div class="stat-lbl">Avg Quality</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ formatMinutes(stats.week_avg_duration_minutes) }}</div>
          <div class="stat-lbl">This Week Avg</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ formatMinutes(stats.longest_sleep_minutes ?? 0) }}</div>
          <div class="stat-lbl">Longest Sleep</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ formatMinutes(stats.shortest_sleep_minutes ?? 0) }}</div>
          <div class="stat-lbl">Shortest Sleep</div>
        </div>
      </div>
    }

    <!-- Bar Chart Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Sleep Duration — Last 7 Records</div>
        <!-- (click) event → reload stats -->
        <button class="btn-refresh" (click)="loadData()">Refresh</button>
      </div>

      @if (loading) {
        <div class="loading-msg">Loading statistics...</div>
      } @else if (records.length === 0) {
        <div class="empty-state">No records yet. Add sleep records to see statistics.</div>
      } @else {
        <div class="chart-wrap">
          <!-- @for over chart data -->
          @for (bar of chartBars; track bar.label) {
            <div class="bar-col">
              <span class="bar-val">{{ bar.value }}</span>
              <div class="bar" [style.height.px]="bar.height" [ngClass]="bar.colorClass"></div>
              <span class="bar-lbl">{{ bar.label }}</span>
            </div>
          }
        </div>
      }

      @if (error) {
        <div class="error-banner">{{ error }}</div>
      }
    </div>

    <!-- Quality Distribution Card -->
    @if (qualityDist.length > 0) {
      <div class="card">
        <div class="card-header">
          <div class="card-title">Quality Distribution</div>
        </div>
        <div class="quality-dist">
          @for (item of qualityDist; track item.label) {
            <div class="dist-row">
              <span class="dist-label">{{ item.label }}</span>
              <div class="dist-bar-wrap">
                <div class="dist-bar" [style.width.%]="item.pct" [ngClass]="item.cls"></div>
              </div>
              <span class="dist-count">{{ item.count }}</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 20px; text-align: center; }
    .stat-val { font-size: 28px; font-weight: 700; color: var(--gray-900); }
    .stat-lbl { font-size: 12px; color: var(--gray-400); margin-top: 4px; font-weight: 500; }
    .btn-refresh { padding: 7px 14px; border: 1px solid var(--gray-200); background: #fff; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; cursor: pointer; color: var(--gray-600); transition: all .15s; }
    .btn-refresh:hover { border-color: var(--blue); color: var(--blue); }
    .chart-wrap { display: flex; align-items: flex-end; gap: 10px; height: 160px; padding: 0 4px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 5px; height: 100%; justify-content: flex-end; }
    .bar { width: 100%; border-radius: 4px 4px 0 0; min-height: 4px; transition: height .3s; background: var(--blue); }
    .bar.high { background: var(--green); }
    .bar.mid  { background: var(--blue); }
    .bar.low  { background: var(--amber); }
    .bar-lbl  { font-size: 11px; color: var(--gray-400); }
    .bar-val  { font-size: 11px; color: var(--gray-600); font-weight: 600; }
    .quality-dist { display: flex; flex-direction: column; gap: 12px; }
    .dist-row { display: flex; align-items: center; gap: 12px; }
    .dist-label { width: 100px; font-size: 13px; color: var(--gray-600); flex-shrink: 0; }
    .dist-bar-wrap { flex: 1; height: 10px; background: var(--gray-100); border-radius: 5px; overflow: hidden; }
    .dist-bar { height: 100%; border-radius: 5px; transition: width .4s; background: var(--blue); }
    .dist-bar.excellent { background: var(--purple); }
    .dist-bar.good      { background: var(--green); }
    .dist-bar.average   { background: var(--amber); }
    .dist-bar.poor      { background: var(--red); }
    .dist-count { width: 24px; text-align: right; font-size: 13px; font-weight: 600; color: var(--gray-500); }
  `]
})
export class StatisticsComponent implements OnInit {
  stats: SleepStats | null = null;
  records: SleepRecord[] = [];
  chartBars: { label: string; value: string; height: number; colorClass: string }[] = [];
  qualityDist: { label: string; count: number; pct: number; cls: string }[] = [];
  loading = false;
  error = '';

  constructor(private sleepService: SleepService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.sleepService.getStats().subscribe({
      next: (s) => { this.stats = s; },
      error: () => {}
    });

    this.sleepService.getRecords().subscribe({
      next: (records) => {
        this.records = records;
        this.buildChart(records.slice(0, 7).reverse());
        this.buildQualityDist(records);
        this.loading = false;
      },
      error: (err: Error) => { this.error = err.message; this.loading = false; }
    });
  }

  buildChart(recs: SleepRecord[]): void {
    const maxDur = Math.max(...recs.map(r => r.duration_minutes), 1);
    this.chartBars = recs.map(r => ({
      label: new Date(r.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      value: r.duration_hours,
      height: Math.max(8, Math.round((r.duration_minutes / maxDur) * 130)),
      colorClass: r.duration_minutes >= 480 ? 'high' : r.duration_minutes >= 360 ? 'mid' : 'low',
    }));
  }

  buildQualityDist(recs: SleepRecord[]): void {
    const total = recs.length;
    if (!total) { this.qualityDist = []; return; }
    const labels = [
      { q: 5, label: '5 - Excellent', cls: 'excellent' },
      { q: 4, label: '4 - Good', cls: 'good' },
      { q: 3, label: '3 - Average', cls: 'average' },
      { q: 2, label: '2 - Poor', cls: 'poor' },
      { q: 1, label: '1 - Very Poor', cls: 'poor' },
    ];
    this.qualityDist = labels.map(l => {
      const count = recs.filter(r => r.quality === l.q).length;
      return { label: l.label, count, pct: Math.round((count / total) * 100), cls: l.cls };
    }).filter(l => l.count > 0);
  }

  formatMinutes(mins: number): string {
    if (!mins) return '—';
    return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  }
}
