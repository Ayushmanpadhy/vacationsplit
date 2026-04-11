import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { Member, Trip } from '../models';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="home-page" *ngIf="trip">
    <div class="home-logo">✈️ VacationSplit</div>
    <div class="home-form">
      <h3 style="margin-bottom:8px">Join {{trip.name}}</h3>
      <p style="font-size:14px; color:var(--text-sec); margin-bottom:20px">Select your name to enter the trip</p>
      
      <div class="input-group">
        <label>Select your name</label>
        <select [(ngModel)]="selectedToken">
          <option value="">-- Choose --</option>
          <option *ngFor="let m of members" [value]="m.token">{{m.name}}</option>
        </select>
      </div>

      <button class="btn btn-primary btn-full" (click)="onJoin()" [disabled]="!selectedToken">Join Trip</button>
      <button class="btn btn-ghost btn-full" style="margin-top:10px" (click)="goHome()">Cancel</button>
    </div>
  </div>
  `,
  styles: [`
    .home-page { padding: 40px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
    .home-logo { font-size: 36px; font-weight: 800; color: var(--primary); margin-bottom: 24px; }
    .home-form { width: 100%; max-width: 420px; background: var(--surface); border-radius: var(--radius-card); border: 1px solid var(--border); padding: 24px; }
    .input-group { margin-bottom: 24px; }
  `]
})
export class JoinComponent implements OnInit {
  trip?: Trip;
  members: Member[] = [];
  selectedToken = '';
  code = '';

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.code = this.route.snapshot.params['code'];
    this.api.getTripByCode(this.code).subscribe(trip => {
      this.trip = trip;
      if (trip.id) {
        this.api.getMembersByTrip(trip.id).subscribe(members => {
          this.members = members;
        });
      }
    }, err => {
      this.router.navigate(['/']);
    });
  }

  onJoin() {
    if (!this.selectedToken) return;
    sessionStorage.setItem('vs_token_' + this.code, this.selectedToken);
    this.router.navigate(['/trip', this.code, 'dashboard']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
