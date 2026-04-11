import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, Member, Expense, Split, ActivityLog, Balance, Settlement } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  // Trips
  createTrip(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/trips`, data);
  }

  getTripByCode(code: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/trips/${code}`);
  }

  // Members
  getMembersByTrip(tripId: number): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/members/trip/${tripId}`);
  }

  addMember(tripId: number, name: string): Observable<Member> {
    return this.http.post<Member>(`${this.apiUrl}/members/trip/${tripId}`, { name });
  }

  getMemberByToken(token: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/members/token/${token}`);
  }

  // Expenses
  getExpensesByTrip(tripId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses/trip/${tripId}`);
  }

  getSplitsForExpense(expenseId: number): Observable<Split[]> {
    return this.http.get<Split[]>(`${this.apiUrl}/expenses/${expenseId}/splits`);
  }

  addExpense(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/expenses`, data);
  }

  deleteExpense(expenseId: number, token: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/expenses/${expenseId}?member_token=${token}`);
  }

  // Activity
  getActivityLog(tripId: number): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/activity/trip/${tripId}`);
  }

  // Balances
  getBalances(tripId: number): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${this.apiUrl}/balances/trip/${tripId}`);
  }

  getSettlements(tripId: number): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.apiUrl}/balances/trip/${tripId}/settlements`);
  }
}
