export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIFIC_DAYS' | 'MULTIPLE_TIMES_DAILY';
export type Status = 'DONE' | 'SKIPPED' | 'PARTIAL' | 'FAILED';
export type Theme = 'light' | 'dark';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: Frequency;
  targetQuantity?: number;
  unit?: string;
  daysOfWeek?: number[];
  allowMultipleLogs: boolean;
  createdAt: string;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string;
  status: Status;
  quantity?: number;
  note?: string;
  insertedAt: string;
}

export interface UserSettings {
  userId: string;
  timezone: string;
  dailyReminderTime?: string;
  notificationEnabled: boolean;
  theme: Theme;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description?: string;
  achievedAt: string;
} 