// TypeScript interfaces for the database models

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_LABELS: Record<DayKey, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

export interface Cycle {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  vision: string;
  is_active: number;
  created_at: string;
}

export interface Goal {
  id: number;
  cycle_id: number;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface Tactic {
  id: number;
  goal_id: number;
  title: string;
  weekly_target: number;
  sort_order: number;
  created_at: string;
}

export interface WeeklyScore {
  id: number;
  cycle_id: number;
  week_number: number;
  tactic_id: number;
  sun: number;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
}

export interface WeeklyReview {
  id: number;
  cycle_id: number;
  week_number: number;
  wins: string;
  improvements: string;
  insights: string;
  created_at: string;
}

export interface WeekScoreSummary {
  week_number: number;
  total_tactics: number;
  completed_tactics: number;
  score: number;
}

export interface GoalProgress {
  goal_id: number;
  goal_title: string;
  total_tactics: number;
  completed_tactics: number;
  score: number;
}

export interface TacticWithScore {
  tactic_id: number;
  tactic_title: string;
  goal_id: number;
  goal_title: string;
  weekly_target: number;
  sun: number;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
}
