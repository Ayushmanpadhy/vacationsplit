export interface Trip {
  id?: number;
  code: string;
  name: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface Member {
  id: number;
  trip_id: number;
  name: string;
  token?: string;
  color_index: number;
  joined_at: string;
}

export interface Expense {
  id?: number;
  trip_id: number;
  title: string;
  total_amount: number;
  paid_by: number;
  added_by: number;
  category_id: number;
  split_type: 'even' | 'custom';
  note?: string;
  created_at?: string;
}

export interface Split {
  id?: number;
  expense_id?: number;
  member_id: number;
  amount_owed: number;
  member_name?: string;
}

export interface ActivityLog {
  id: number;
  trip_id: number;
  member_id: number;
  action: string;
  description: string;
  created_at: string;
  member_name?: string;
}

export interface Balance {
    member_id: number;
    member_name: string;
    color_index: number;
    total_paid: number;
    total_owed: number;
    net_balance: number;
}

export interface Settlement {
    payer: string;
    payer_id: number;
    receiver: string;
    receiver_id: number;
    amount: number;
}
