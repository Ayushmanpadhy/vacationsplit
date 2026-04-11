import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { Trip, Member } from '../models';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="top-bar">
    <button class="back-btn" (click)="goBack()">←</button>
    <div class="top-bar-title">Add Expense</div>
    <div class="top-bar-side"></div>
  </div>

  <div class="page-inner-sm" *ngIf="trip">
    <div class="input-group">
      <label>What was it for?</label>
      <input type="text" [(ngModel)]="expense.title" placeholder="e.g. Beach dinner, Hotel booking" maxlength="100"/>
    </div>

    <div class="input-group">
      <label>Category</label>
      <div class="cat-pills">
        <div class="cat-pill" *ngFor="let c of categories" 
             [class.selected]="expense.category_id === c.id" 
             (click)="expense.category_id = c.id">
          {{c.emoji}} {{c.name}}
        </div>
      </div>
    </div>

    <div class="input-group">
      <label>Total amount</label>
      <div class="input-prefix-wrap">
        <span class="prefix">₹</span>
        <input type="number" [(ngModel)]="expense.total_amount" placeholder="0" (input)="updateSplits()"/>
      </div>
    </div>

    <div class="input-group">
      <label>Paid by</label>
      <select [(ngModel)]="expense.paid_by">
        <option *ngFor="let m of members" [value]="m.id">{{m.name}}</option>
      </select>
    </div>

    <div class="input-group">
      <label>Splitting with</label>
      <div class="member-grid">
        <div class="member-card" *ngFor="let m of members" 
             [class.selected]="isMemberSelected(m.id)" 
             (click)="toggleMember(m.id)">
             {{m.name}}
             <span class="check" *ngIf="isMemberSelected(m.id)">✓</span>
        </div>
      </div>
    </div>

    <button class="btn btn-primary btn-full" (click)="onSave()" [disabled]="!isFormValid()">Save Expense</button>
  </div>
  `,
  styles: [`
    .page-inner-sm { max-width: 480px; margin: 0 auto; padding: 20px; }
    .input-group { margin-bottom: 20px; }
    .cat-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .cat-pill { padding: 8px 14px; border-radius: 50px; border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; font-size: 13px; }
    .cat-pill.selected { border-color: var(--primary); background: var(--primary-faint); color: var(--primary); }
    .input-prefix-wrap { position: relative; }
    .prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-weight: 600; }
    .input-prefix-wrap input { padding-left: 30px; }
    .member-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .member-card { padding: 12px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); cursor: pointer; display: flex; justify-content: space-between; }
    .member-card.selected { border-color: var(--primary); background: var(--primary-faint); }
    .back-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
  `]
})
export class AddExpenseComponent implements OnInit {
  tripCode = '';
  trip?: Trip;
  members: Member[] = [];
  me?: Member;

  expense = {
    title: '',
    total_amount: 0,
    paid_by: 0,
    category_id: 1,
    split_type: 'even' as 'even' | 'custom',
    note: ''
  };

  selectedMembers: number[] = [];

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
        this.api.getMembersByTrip(trip.id).subscribe(m => {
          this.members = m;
          this.selectedMembers = m.map(x => x.id);
          if (token) {
            this.api.getMemberByToken(token).subscribe(me => {
              this.me = me;
              this.expense.paid_by = me.id;
            });
          } else if (m.length > 0) {
            this.expense.paid_by = m[0].id;
          }
        });
      }
    });
  }

  isMemberSelected(id: number) {
    return this.selectedMembers.includes(id);
  }

  toggleMember(id: number) {
    if (this.isMemberSelected(id)) {
      this.selectedMembers = this.selectedMembers.filter(x => x !== id);
    } else {
      this.selectedMembers.push(id);
    }
  }

  updateSplits() {}

  isFormValid() {
    return this.expense.title && this.expense.total_amount > 0 && this.selectedMembers.length > 0;
  }

  onSave() {
    if (!this.trip?.id || !this.me?.id) return;

    const each = Math.round((this.expense.total_amount / this.selectedMembers.length) * 100) / 100;
    const splits = this.selectedMembers.map(id => ({ member_id: id, amount_owed: each }));

    const payload = {
      ...this.expense,
      trip_id: this.trip.id,
      added_by: this.me.id,
      splits
    };

    this.api.addExpense(payload).subscribe(() => {
      this.router.navigate(['/trip', this.tripCode, 'dashboard']);
    });
  }

  goBack() {
    this.router.navigate(['/trip', this.tripCode, 'dashboard']);
  }
}
