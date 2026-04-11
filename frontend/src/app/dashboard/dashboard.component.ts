import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { Trip, Member, Expense, Balance, ActivityLog } from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="top-bar">
    <div class="top-bar-side"></div>
    <div class="top-bar-title">Dashboard</div>
    <span class="trip-code-pill" (click)="copyCode()">{{tripCode}} 📋</span>
  </div>

  <div class="page-inner" *ngIf="trip">
    <div class="trip-header">
      <div class="trip-name">{{trip.name}}</div>
      <div class="trip-dest">📍 {{trip.destination || 'Trip'}}</div>
      <div class="trip-dates-badge" *ngIf="trip.start_date">📅 {{trip.start_date | date:'dd MMM'}} – {{trip.end_date | date:'dd MMM'}}</div>
    </div>

    <div class="members-strip">
      <div class="member-strip-item" *ngFor="let m of members">
        <div class="avatar" [style.background]="getMemberColor(m.color_index).bg" [style.color]="getMemberColor(m.color_index).text">
          {{m.name[0].toUpperCase()}}
        </div>
        <div class="mname">{{m.name.split(' ')[0]}}</div>
      </div>
    </div>

    <div class="summary-cards">
      <div class="sum-card">
        <div class="s-label">Total Spent</div>
        <div class="s-value">₹{{totalSpent | number:'1.0-2'}}</div>
      </div>
      <div class="sum-card">
        <div class="s-label">Your Share</div>
        <div class="s-value">₹{{myShare | number:'1.0-2'}}</div>
      </div>
      <div class="sum-card">
        <div class="s-label">Balance</div>
        <div class="s-value" [ngClass]="myNet > 0 ? 'amount-positive' : myNet < 0 ? 'amount-negative' : 'amount-zero'">
          {{myNet >= 0 ? '+' : ''}}₹{{Math.abs(myNet) | number:'1.0-2'}}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="section-heading">
      <h3>Expenses</h3>
      <button class="btn btn-primary btn-sm" [routerLink]="['/trip', tripCode, 'add-expense']">+ Add</button>
    </div>

    <div class="expenses-list">
      <div class="empty-state" *ngIf="expenses.length === 0">
        <div class="empty-icon">🧾</div>
        <h3>No expenses yet</h3>
        <p>Add your first expense and start tracking!</p>
      </div>

      <div class="expense-card" *ngFor="let e of expenses">
        <div class="exp-cat-icon">{{getCategoryIcon(e.category_id)}}</div>
        <div class="exp-body">
          <div class="exp-title">{{e.title}}</div>
          <div class="exp-meta">Paid by {{getMemberName(e.paid_by)}} · {{getCategoryName(e.category_id)}}</div>
        </div>
        <div class="exp-right">
          <div class="exp-amount">₹{{e.total_amount | number:'1.0-2'}}</div>
          <div class="exp-added">{{e.created_at | date:'dd MMM'}}</div>
        </div>
      </div>
    </div>
  </div>

  <nav class="bottom-nav">
    <a class="nav-item active" [routerLink]="['/trip', tripCode, 'dashboard']">
      <span class="nav-icon">📊</span>
      <span class="nav-label">Dashboard</span>
    </a>
    <a class="nav-item" [routerLink]="['/trip', tripCode, 'balances']">
      <span class="nav-icon">💸</span>
      <span class="nav-label">Balances</span>
    </a>
  </nav>
  `,
  styles: [`
    .page-inner { max-width: 700px; margin: 0 auto; padding: 16px; padding-bottom: 80px; }
    .trip-header { padding-bottom: 20px; }
    .trip-name { font-size: 24px; font-weight: 800; }
    .trip-dest { font-size: 14px; color: var(--text-sec); }
    .trip-dates-badge { display: inline-flex; align-items: center; gap: 4px; background: #F0EDE8; border-radius: 50px; padding: 4px 12px; font-size: 12px; font-weight: 600; color: var(--text-sec); margin-top: 8px; }
    .trip-code-pill { background: var(--primary-faint); color: var(--primary); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 50px; cursor: pointer; border: 1.5px solid #FFD4C0; }
    
    .members-strip { display: flex; gap: 12px; overflow-x: auto; padding: 14px 0; }
    .member-strip-item { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
    .mname { font-size: 11px; font-weight: 600; color: var(--text-sec); }

    .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
    .sum-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 14px; text-align: center; }
    .s-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }
    .s-value { font-size: 16px; font-weight: 700; }

    .divider { height: 1px; background: var(--border); margin: 20px 0; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

    .expense-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-card); margin-bottom: 8px; }
    .exp-cat-icon { width: 42px; height: 42px; border-radius: 10px; background: var(--primary-faint); display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .exp-body { flex: 1; }
    .exp-title { font-size: 14px; font-weight: 700; }
    .exp-meta { font-size: 12px; color: var(--text-sec); }
    .exp-right { text-align: right; }
    .exp-amount { font-size: 16px; font-weight: 700; }
    .exp-added { font-size: 11px; color: var(--text-muted); }

    .amount-positive { color: var(--success); }
    .amount-negative { color: var(--danger); }
    .amount-zero { color: var(--text-muted); }

    .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; text-decoration: none; color: var(--text-muted); }
    .nav-item.active { color: var(--primary); }
    .nav-label { font-size: 11px; font-weight: 600; }

    .empty-state { text-align: center; padding: 48px 24px; color: var(--text-sec); }
  `]
})
export class DashboardComponent implements OnInit {
  tripCode = '';
  trip?: Trip;
  members: Member[] = [];
  expenses: Expense[] = [];
  balances: Balance[] = [];
  activity: ActivityLog[] = [];
  me?: Member;

  totalSpent = 0;
  myShare = 0;
  myNet = 0;
  Math = Math;

  memberColors = [
    { bg: '#FFE4D6', text: '#C04A00' },
    { bg: '#D6F0FF', text: '#006B99' },
    { bg: '#D6FFE8', text: '#007A3D' },
    { bg: '#F0D6FF', text: '#6B00A8' },
    { bg: '#FFD6D6', text: '#A80000' }
  ];

  categories = [
    { id: 1, name: 'Food', emoji: '🍽️' },
    { id: 2, name: 'Hotel', emoji: '🏨' },
    { id: 3, name: 'Travel', emoji: '🚗' },
    { id: 4, name: 'Shopping', emoji: '🛍️' },
    { id: 5, name: 'Other', emoji: '📦' }
  ];

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.tripCode = this.route.snapshot.params['code'];
    const token = sessionStorage.getItem('vs_token_' + this.tripCode);

    this.api.getTripByCode(this.tripCode).subscribe(trip => {
      this.trip = trip;
      if (trip.id) {
        this.loadData(trip.id);
      }
    });

    if (token) {
      this.api.getMemberByToken(token).subscribe(m => this.me = m);
    }
  }

  loadData(tripId: number) {
    this.api.getMembersByTrip(tripId).subscribe(m => this.members = m);
    this.api.getExpensesByTrip(tripId).subscribe(e => {
        this.expenses = e;
        this.totalSpent = e.reduce((sum, item) => sum + Number(item.total_amount), 0);
    });
    this.api.getBalances(tripId).subscribe(b => {
        this.balances = b;
        const myBal = b.find(x => x.member_id === this.me?.id);
        if (myBal) {
            this.myShare = myBal.total_owed;
            this.myNet = myBal.net_balance;
        }
    });
  }

  getMemberColor(idx: number) {
    return this.memberColors[idx % this.memberColors.length];
  }

  getCategoryIcon(id: number) {
    return this.categories.find(c => c.id === id)?.emoji || '📦';
  }

  getCategoryName(id: number) {
    return this.categories.find(c => c.id === id)?.name || 'Other';
  }

  getMemberName(id: number) {
    return this.members.find(m => m.id === id)?.name || 'Unknown';
  }

  copyCode() {
    navigator.clipboard.writeText(this.tripCode);
    alert('Code copied!');
  }
}
