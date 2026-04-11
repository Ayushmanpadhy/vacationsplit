import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="home-page">
    <div class="home-logo">✈️ VacationSplit</div>
    <p class="home-sub">Split trip expenses with your group.<br>No signups. No confusion.</p>

    <div class="home-cards">
      <div class="home-card" [class.selected]="mode === 'create'" (click)="mode = 'create'">
        <div class="hc-icon">🗺️</div>
        <div class="hc-title">Create a Trip</div>
        <div class="hc-sub">Start a new group</div>
      </div>
      <div class="home-card" [class.selected]="mode === 'join'" (click)="mode = 'join'">
        <div class="hc-icon">🔑</div>
        <div class="hc-title">Join with Code</div>
        <div class="hc-sub">Enter trip code</div>
      </div>
    </div>

    <div class="home-form" *ngIf="mode === 'create'">
      <h3 style="margin-bottom:16px">Create Your Trip</h3>
      <div class="input-group">
        <label>Trip name</label>
        <input type="text" [(ngModel)]="tripData.name" placeholder="e.g. Goa Trip 2025" maxlength="60"/>
      </div>
      <div class="input-group">
        <label>Destination</label>
        <input type="text" [(ngModel)]="tripData.destination" placeholder="e.g. Goa, India" maxlength="80"/>
      </div>
      <div class="input-row">
        <div class="input-group">
          <label>Start date</label>
          <input type="date" [(ngModel)]="tripData.start_date"/>
        </div>
        <div class="input-group">
          <label>End date</label>
          <input type="date" [(ngModel)]="tripData.end_date"/>
        </div>
      </div>
      <div class="input-group">
        <label>Your name</label>
        <input type="text" [(ngModel)]="tripData.creator_name" placeholder="What do your friends call you?" maxlength="30"/>
      </div>

      <button class="btn btn-primary btn-full" (click)="onCreate()">Create Trip 🚀</button>
    </div>

    <div class="home-form" *ngIf="mode === 'join'">
      <h3 style="margin-bottom:16px">Join a Trip</h3>
      <div class="input-group">
        <label>Trip code</label>
        <input type="text" [(ngModel)]="joinCode" placeholder="e.g. GOA25X" maxlength="6"/>
      </div>
      <button class="btn btn-primary btn-full" (click)="onJoin()">Join Trip</button>
    </div>
  </div>
  `,
  styles: [`
    .home-page { padding: 40px 16px; display: flex; flex-direction: column; align-items: center; }
    .home-logo { font-size: 36px; font-weight: 800; color: var(--primary); margin-bottom: 8px; }
    .home-sub { font-size: 15px; color: var(--text-sec); text-align: center; margin-bottom: 40px; }
    .home-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 420px; margin-bottom: 24px; }
    .home-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-card); padding: 24px 16px; text-align: center; cursor: pointer; }
    .home-card.selected { border-color: var(--primary); background: var(--primary-faint); }
    .hc-icon { font-size: 32px; margin-bottom: 8px; }
    .hc-title { font-size: 14px; font-weight: 700; }
    .hc-sub   { font-size: 12px; color: var(--text-sec); margin-top: 3px; }
    .home-form { width: 100%; max-width: 420px; background: var(--surface); border-radius: var(--radius-card); border: 1px solid var(--border); padding: 24px; }
    .input-group { margin-bottom: 16px; }
    .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `]
})
export class HomeComponent {
  mode: 'create' | 'join' | null = 'create';
  tripData = { name: '', destination: '', start_date: '', end_date: '', creator_name: '' };
  joinCode = '';

  constructor(private api: ApiService, private router: Router) {}

  onCreate() {
    if (!this.tripData.name || !this.tripData.creator_name) return;
    this.api.createTrip(this.tripData).subscribe(res => {
      sessionStorage.setItem('vs_token_' + res.trip_code, res.member_token);
      this.router.navigate(['/trip', res.trip_code, 'dashboard']);
    });
  }

  onJoin() {
    if (!this.joinCode) return;
    this.router.navigate(['/join', this.joinCode]);
  }
}
