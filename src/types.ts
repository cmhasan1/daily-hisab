export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface AppSettings {
  language: 'bn' | 'en';
  theme: 'light' | 'dark';
  pinEnabled: boolean;
  pinCode: string; // 4-digit PIN
  monthlyBudget: number; // General budget limit
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  notes?: string;
}

export const DEFAULT_BANGLA_CATEGORIES = {
  income: [
    { id: 'salary', label: 'বেতন (Salary)', color: '#10B981' },
    { id: 'tuition', label: 'টিউশন ফি (Tuition Fee)', color: '#3B82F6' },
    { id: 'training', label: 'ট্রেইনিং (Training)', color: '#8B5CF6' },
    { id: 'other_income', label: 'অন্যান্য (Others)', color: '#6B7280' },
  ],
  expense: [
    { id: 'grocery', label: 'বাজার (Groceries)', color: '#EF4444' },
    { id: 'dining', label: 'এক্সট্রা খাবার (Eating Out)', color: '#10B981' },
    { id: 'rent', label: 'বাসা ভাড়া (House Rent)', color: '#F57C00' },
    { id: 'transport', label: 'যাতায়াত (Transport)', color: '#3B82F6' },
    { id: 'phone_bill', label: 'ফোন বিল (Phone Bill)', color: '#06B6D4' },
    { id: 'electricity_bill', label: 'কারেন্ট বিল (Current Bill)', color: '#F59E0B' },
    { id: 'medical', label: 'চিকিৎসা (Treatment)', color: '#EC4899' },
    { id: 'other_expense', label: 'অন্যান্য (Others)', color: '#6B7280' },
  ]
};
