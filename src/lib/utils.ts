import dayjs from 'dayjs';

/**
 * Calculate the current week number (1-12) for a given cycle.
 * Returns 0 if before start, 13 if after end.
 */
export function getCurrentWeek(startDate: string): number {
  const start = dayjs(startDate);
  const now = dayjs();
  const diffDays = now.diff(start, 'day');
  
  if (diffDays < 0) return 0;
  
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(week, 13);
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('MMM D, YYYY');
}

/**
 * Calculate the end date (12 weeks = 84 days) from start.
 */
export function calcEndDate(startDate: string): string {
  return dayjs(startDate).add(83, 'day').format('YYYY-MM-DD');
}

/**
 * Get color based on score thresholds from the book:
 * - green: 85%+ (on track)
 * - orange/warning: 65-84% (needs improvement)
 * - red: <65% (critical)
 */
export function getScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 85) return 'success';
  if (score >= 65) return 'warning';
  return 'error';
}

/**
 * Get hex color for charts based on score.
 */
export function getScoreHex(score: number): string {
  if (score >= 85) return '#4caf50';
  if (score >= 65) return '#ff9800';
  return '#f44336';
}
