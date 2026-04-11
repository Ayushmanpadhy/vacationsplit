import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { JoinComponent } from './join/join.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { SettleUpComponent } from './settle-up/settle-up.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'join/:code', component: JoinComponent },
  { path: 'trip/:code/dashboard', component: DashboardComponent },
  { path: 'trip/:code/add-expense', component: AddExpenseComponent },
  { path: 'trip/:code/balances', component: SettleUpComponent },
  { path: '**', redirectTo: '' }
];
