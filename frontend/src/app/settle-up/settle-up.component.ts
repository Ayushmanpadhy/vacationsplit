import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { Trip, Member, Balance, Settlement } from '../models';

@Component({
  selector: 'app-settle-up',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="top-bar">
    <button class="back-btn" [routerLink]="['/trip', tripCode, 'dashboard']">←</button>
    <div class="top-bar-title">Settle Up</div>
    <div class="top-bar-side"></div>
  </div>

  <div class="page-inner-sm" *ngIf="trip">
    <div class="net-balance-card" [style.background]="myNet > 0 ? 'var(--success-light)' : myNet < 0 ? 'var(--danger-light)' : '#F0EDE8'">
      <div class="nb-label" [style.color]="myNet > 0 ? 'var(--success)' : myNet < 0 ? 'var(--danger)' : 'var(--text-sec)'">
        {{myNet > 0 ? 'You are owed' : myNet < 0 ? 'You owe in total' : 'You are all settled'}}
      </div>
      <div class="nb-amount" [style.color]="myNet > 0 ? 'var(--success)' : myNet < 0 ? 'var(--danger)' : 'var(--text-sec)'">
        ₹{{Math.abs(myNet) | number:'1.0-2'}}
      </div>
    </div>

    <div class="section-heading mt-24"><h3>Minimum Transactions</h3></div>
    <div class="card" *ngIf="settlements.length > 0">
      <div class="settlement-row" *ngFor="let s of settlements">
        <span class="s-from">{{s.payer}}</span>
        <span class="s-arrow">→</span>
        <span class="s-to">{{s.receiver}}</span>
        <span class="s-amount">₹{{s.amount | number:'1.0-2'}}</span>
      </div>
    </div>
    <div class="empty-state" *ngIf="settlements.length === 0">
       <div class="empty-icon">🎉</div>
       <p>All settled up!</p>
    </div>

    <div class="section-heading mt-24"><h3>All Balances</h3></div>
    <div class="card">
      <div class="balance-row" *ngFor="let b of balances">
        <div class="balance-info">
          <div class="balance-name">{{b.member_name}}</div>
          <div class="balance-sub">Paid ₹{{b.total_paid | number:'1.0-2'}} · Owes ₹{{b.total_owed | number:'1.0-2'}}</div>
        </div>
        <div class="balance-amount" [ngClass]="b.net_balance > 0 ? 'amount-positive' : b.net_balance < 0 ? 'amount-negative' : 'amount-zero'">
          {{b.net_balance >= 0 ? '+' : ''}}₹{{Math.abs(b.net_balance) | number:'1.0-2'}}
        </div>
      </div>
    </div>
  </div>

  <nav class="bottom-nav">
    <a class="nav-item" [routerLink]="['/trip', tripCode, 'dashboard']">
      <span class="nav-icon">📊</span>
      <span class="nav-label">Dashboard</span>
    </a>
    <a class="nav-item active" [routerLink]="['/trip', tripCode, 'balances']">
      <span class="nav-icon">💸</span>
      <span class="nav-label">Balances</span>
    </a>
  </nav>
  `,
  styles: [`
    .page-inner-sm { max-width: 480px; margin: 0 auto; padding: 20px; padding-bottom: 80px; }
    .net-balance-card { border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .nb-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .nb-amount { font-size: 32px; font-weight: 800; }
    .settlement-row { display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .settlement-row:last-child { border-bottom: none; }
    .s-from, .s-to { font-size: 14px; font-weight: 600; }
    .s-arrow { color: var(--text-muted); }
    .s-amount { margin-left: auto; font-weight: 700; color: var(--danger); }
    .balance-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .balance-row:last-child { border-bottom: none; }
    .balance-name { font-size: 14px; font-weight: 600; }
    .balance-sub { font-size: 12px; color: var(--text-sec); }
    .balance-amount { font-weight: 700; }
    .mt-24 { margin-top: 24px; }
    .section-heading { margin-bottom: 12px; }
    .back-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
    .amount-positive { color: var(--success); }
    .amount-negative { color: var(--danger); }
    .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; text-decoration: none; color: var(--text-muted); }
    .nav-item.active { color: var(--primary); }
    .nav-label { font-size: 11px; font-weight: 600; }
  `]
})
export class SettleUpComponent implements OnInit {
  tripCode = '';
  trip?: Trip;
  balances: Balance[] = [];
  settlements: Settlement[] = [];
  myNet = 0;
  Math = Math;
  me?: Member;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.tripCode = this.route.snapshot.params['code'];
    const token = sessionStorage.getItem('vs_token_' + this.tripCode);

    this.api.getTripByCode(this.tripCode).subscribe(trip => {
      this.trip = trip;
      if (trip.id) {
        this.api.getBalances(trip.id).subscribe(b => {
          this.balances = b;
          if (token) {
            this.api.getMemberByToken(token).subscribe(m => {
              this.me = m;
              const myBal = b.find(x => x.member_id === m.id);
              if (myBal) this.myNet = myBal.net_balance;
            });
          }
        });
        this.api.getSettlements(trip.id).subscribe(s => this.settlements = s);
      }
    });
  }
}
