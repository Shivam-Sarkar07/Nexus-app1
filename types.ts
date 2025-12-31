export enum Category {
  SOCIAL = 'Social',
  GAMES = 'Games',
  EDUCATION = 'Education',
  UTILITIES = 'Utilities',
  PRODUCTIVITY = 'Productivity',
  ENTERTAINMENT = 'Entertainment',
  FINANCE = 'Finance'
}

export interface AppData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Category;
  url1: string; // Primary link
  url2: string; // Failover link
  isPremium: boolean;
  rating: number;
  plays: number;
}

export interface PointTransaction {
  id: string;
  date: string;
  amount: number;
  reason: string;
  type: 'earned' | 'redeemed';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  isPremium: boolean;
  avatar: string;
  isAdmin: boolean;
  joinedDate: string;
  themePreference: 'light' | 'dark';
  subscriptionStatus: 'active' | 'inactive';
  subscriptionDate?: string;
  subscriptionId?: string;
}

export interface HistoryItem {
  id: string;
  appId: string;
  appName: string;
  appIcon: string;
  timestamp: number;
  durationSeconds: number;
}

export interface BugReport {
  id: string;
  userId: string;
  userName: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  rewardPoints: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  date: string;
  status: 'open' | 'closed';
}