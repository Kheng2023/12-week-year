import { getDb, saveDb } from './database';
import type { SqlValue } from 'sql.js';
import type {
  Cycle,
  Goal,
  Tactic,
  WeeklyReview,
  WeekScoreSummary,
  GoalProgress,
  TacticWithScore,
  DayKey,
} from '../types';

// Helper: convert sql.js result rows to typed objects
function queryAll<T>(sql: string, params: SqlValue[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T>(sql: string, params: SqlValue[] = []): T | null {
  const results = queryAll<T>(sql, params);
  return results[0] ?? null;
}

function run(sql: string, params: SqlValue[] = []): void {
  const db = getDb();
  if (params.length === 0) {
    db.run(sql);
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  }
}

// ─── Cycles ──────────────────────────────────────────────

export async function createCycle(
  title: string,
  startDate: string,
  endDate: string,
  vision: string
): Promise<number> {
  // Deactivate all existing cycles
  run('UPDATE cycles SET is_active = 0');
  run(
    'INSERT INTO cycles (title, start_date, end_date, vision, is_active) VALUES (?, ?, ?, ?, 1)',
    [title, startDate, endDate, vision]
  );
  const result = queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
  await saveDb();
  return result!.id;
}

export function getCycles(): Cycle[] {
  return queryAll<Cycle>('SELECT * FROM cycles ORDER BY created_at DESC');
}

export function getActiveCycle(): Cycle | null {
  return queryOne<Cycle>('SELECT * FROM cycles WHERE is_active = 1');
}

export function getCycleById(id: number): Cycle | null {
  return queryOne<Cycle>('SELECT * FROM cycles WHERE id = ?', [id]);
}

export async function updateCycle(
  id: number,
  data: { title?: string; vision?: string; start_date?: string; end_date?: string }
): Promise<void> {
  const fields: string[] = [];
  const values: SqlValue[] = [];
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.vision !== undefined) { fields.push('vision = ?'); values.push(data.vision); }
  if (data.start_date !== undefined) { fields.push('start_date = ?'); values.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push('end_date = ?'); values.push(data.end_date); }
  if (fields.length === 0) return;
  values.push(id);
  run(`UPDATE cycles SET ${fields.join(', ')} WHERE id = ?`, values);
  await saveDb();
}

export async function setActiveCycle(id: number): Promise<void> {
  run('UPDATE cycles SET is_active = 0');
  run('UPDATE cycles SET is_active = 1 WHERE id = ?', [id]);
  await saveDb();
}

export async function deleteCycle(id: number): Promise<void> {
  run('DELETE FROM weekly_scores WHERE cycle_id = ?', [id]);
  run('DELETE FROM weekly_reviews WHERE cycle_id = ?', [id]);
  run('DELETE FROM tactics WHERE goal_id IN (SELECT id FROM goals WHERE cycle_id = ?)', [id]);
  run('DELETE FROM goals WHERE cycle_id = ?', [id]);
  run('DELETE FROM cycles WHERE id = ?', [id]);
  await saveDb();
}

// ─── Goals ──────────────────────────────────────────────

export async function createGoal(cycleId: number, title: string, description: string = ''): Promise<number> {
  const maxOrder = queryOne<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) as m FROM goals WHERE cycle_id = ?', [cycleId]);
  run('INSERT INTO goals (cycle_id, title, description, sort_order) VALUES (?, ?, ?, ?)', [
    cycleId, title, description, (maxOrder?.m ?? -1) + 1,
  ]);
  const result = queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
  await saveDb();
  return result!.id;
}

export function getGoalsByCycle(cycleId: number): Goal[] {
  return queryAll<Goal>('SELECT * FROM goals WHERE cycle_id = ? ORDER BY sort_order', [cycleId]);
}

export async function updateGoal(id: number, data: { title?: string; description?: string }): Promise<void> {
  const fields: string[] = [];
  const values: SqlValue[] = [];
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (fields.length === 0) return;
  values.push(id);
  run(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`, values);
  await saveDb();
}

export async function deleteGoal(id: number): Promise<void> {
  run('DELETE FROM weekly_scores WHERE tactic_id IN (SELECT id FROM tactics WHERE goal_id = ?)', [id]);
  run('DELETE FROM tactics WHERE goal_id = ?', [id]);
  run('DELETE FROM goals WHERE id = ?', [id]);
  await saveDb();
}

// ─── Tactics ──────────────────────────────────────────────

export async function createTactic(goalId: number, title: string, weeklyTarget: number = 7): Promise<number> {
  const maxOrder = queryOne<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) as m FROM tactics WHERE goal_id = ?', [goalId]);
  run('INSERT INTO tactics (goal_id, title, weekly_target, sort_order) VALUES (?, ?, ?, ?)', [
    goalId, title, weeklyTarget, (maxOrder?.m ?? -1) + 1,
  ]);
  const result = queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
  await saveDb();
  return result!.id;
}

export function getTacticsByGoal(goalId: number): Tactic[] {
  return queryAll<Tactic>('SELECT * FROM tactics WHERE goal_id = ? ORDER BY sort_order', [goalId]);
}

export function getTacticsByCycle(cycleId: number): Tactic[] {
  return queryAll<Tactic>(
    `SELECT t.* FROM tactics t
     JOIN goals g ON t.goal_id = g.id
     WHERE g.cycle_id = ?
     ORDER BY g.sort_order, t.sort_order`,
    [cycleId]
  );
}

export async function updateTactic(id: number, data: { title?: string; weekly_target?: number }): Promise<void> {
  const fields: string[] = [];
  const values: SqlValue[] = [];
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.weekly_target !== undefined) { fields.push('weekly_target = ?'); values.push(data.weekly_target); }
  if (fields.length === 0) return;
  values.push(id);
  run(`UPDATE tactics SET ${fields.join(', ')} WHERE id = ?`, values);
  await saveDb();
}

export async function deleteTactic(id: number): Promise<void> {
  run('DELETE FROM weekly_scores WHERE tactic_id = ?', [id]);
  run('DELETE FROM tactics WHERE id = ?', [id]);
  await saveDb();
}

// ─── Weekly Scores (Daily Granularity) ──────────────────────────────────────

const VALID_DAYS = new Set(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);

export async function setDayCompletion(
  cycleId: number,
  weekNumber: number,
  tacticId: number,
  day: DayKey,
  value: boolean
): Promise<void> {
  if (!VALID_DAYS.has(day)) return;
  // Ensure a row exists (upsert)
  run(
    `INSERT INTO weekly_scores (cycle_id, week_number, tactic_id)
     VALUES (?, ?, ?)
     ON CONFLICT(cycle_id, week_number, tactic_id) DO NOTHING`,
    [cycleId, weekNumber, tacticId]
  );
  // Update the specific day column
  run(
    `UPDATE weekly_scores SET ${day} = ? WHERE cycle_id = ? AND week_number = ? AND tactic_id = ?`,
    [value ? 1 : 0, cycleId, weekNumber, tacticId]
  );
  await saveDb();
}

export function getWeekScorecard(cycleId: number, weekNumber: number): TacticWithScore[] {
  return queryAll<TacticWithScore>(
    `SELECT 
       t.id as tactic_id,
       t.title as tactic_title,
       t.weekly_target,
       g.id as goal_id,
       g.title as goal_title,
       COALESCE(ws.sun, 0) as sun,
       COALESCE(ws.mon, 0) as mon,
       COALESCE(ws.tue, 0) as tue,
       COALESCE(ws.wed, 0) as wed,
       COALESCE(ws.thu, 0) as thu,
       COALESCE(ws.fri, 0) as fri,
       COALESCE(ws.sat, 0) as sat
     FROM tactics t
     JOIN goals g ON t.goal_id = g.id
     LEFT JOIN weekly_scores ws ON ws.tactic_id = t.id 
       AND ws.cycle_id = ? AND ws.week_number = ?
     WHERE g.cycle_id = ?
     ORDER BY g.sort_order, t.sort_order`,
    [cycleId, weekNumber, cycleId]
  );
}

/**
 * Calculate week score using formula:
 * score = AVG( MIN(days_done, weekly_target) / weekly_target ) * 100
 * 
 * "completed_tactics" = number of tactics where days_done >= weekly_target
 */
export function getWeekScore(cycleId: number, weekNumber: number): WeekScoreSummary {
  const scorecard = getWeekScorecard(cycleId, weekNumber);
  const total = scorecard.length;
  if (total === 0) {
    return { week_number: weekNumber, total_tactics: 0, completed_tactics: 0, score: 0 };
  }

  let sumRatios = 0;
  let fullyCompleted = 0;
  for (const t of scorecard) {
    const daysDone = t.sun + t.mon + t.tue + t.wed + t.thu + t.fri + t.sat;
    const target = t.weekly_target;
    const ratio = target > 0 ? Math.min(daysDone, target) / target : 0;
    sumRatios += ratio;
    if (daysDone >= target) fullyCompleted++;
  }

  return {
    week_number: weekNumber,
    total_tactics: total,
    completed_tactics: fullyCompleted,
    score: Math.round((sumRatios / total) * 100),
  };
}

export function getAllWeekScores(cycleId: number): WeekScoreSummary[] {
  const scores: WeekScoreSummary[] = [];
  for (let week = 1; week <= 12; week++) {
    scores.push(getWeekScore(cycleId, week));
  }
  return scores;
}

export function getGoalProgress(cycleId: number, weekNumber?: number): GoalProgress[] {
  // Get all goals for the cycle
  const goals = queryAll<{ goal_id: number; goal_title: string; sort_order: number }>(
    'SELECT id as goal_id, title as goal_title, sort_order FROM goals WHERE cycle_id = ? ORDER BY sort_order',
    [cycleId]
  );

  return goals.map((goal) => {
    // Get tactics for this goal
    const tactics = queryAll<{ id: number; weekly_target: number }>(
      'SELECT id, weekly_target FROM tactics WHERE goal_id = ?',
      [goal.goal_id]
    );

    if (tactics.length === 0) {
      return { goal_id: goal.goal_id, goal_title: goal.goal_title, total_tactics: 0, completed_tactics: 0, score: 0 };
    }

    // Build week filter
    const weekFilter = weekNumber ? 'AND ws.week_number = ?' : '';
    const weeksDivisor = weekNumber ? 1 : 12;

    let sumRatios = 0;
    let fullyCompleted = 0;

    for (const tactic of tactics) {
      // Sum up days completed across the relevant weeks
      const params: SqlValue[] = weekNumber
        ? [cycleId, tactic.id, weekNumber]
        : [cycleId, tactic.id];

      const result = queryOne<{ days_done: number; weeks_tracked: number }>(
        `SELECT 
           COALESCE(SUM(sun + mon + tue + wed + thu + fri + sat), 0) as days_done,
           COUNT(*) as weeks_tracked
         FROM weekly_scores ws
         WHERE ws.cycle_id = ? AND ws.tactic_id = ? ${weekFilter}`,
        params
      );

      const daysDone = result?.days_done ?? 0;
      const totalTarget = tactic.weekly_target * weeksDivisor;
      const ratio = totalTarget > 0 ? Math.min(daysDone, totalTarget) / totalTarget : 0;
      sumRatios += ratio;
      if (daysDone >= totalTarget) fullyCompleted++;
    }

    return {
      goal_id: goal.goal_id,
      goal_title: goal.goal_title,
      total_tactics: tactics.length,
      completed_tactics: fullyCompleted,
      score: Math.round((sumRatios / tactics.length) * 100),
    };
  });
}

// ─── Weekly Reviews ──────────────────────────────────────────────

export async function saveWeeklyReview(
  cycleId: number,
  weekNumber: number,
  data: { wins: string; improvements: string; insights: string }
): Promise<void> {
  run(
    `INSERT INTO weekly_reviews (cycle_id, week_number, wins, improvements, insights)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(cycle_id, week_number)
     DO UPDATE SET wins = excluded.wins, improvements = excluded.improvements, insights = excluded.insights`,
    [cycleId, weekNumber, data.wins, data.improvements, data.insights]
  );
  await saveDb();
}

export function getWeeklyReview(cycleId: number, weekNumber: number): WeeklyReview | null {
  return queryOne<WeeklyReview>(
    'SELECT * FROM weekly_reviews WHERE cycle_id = ? AND week_number = ?',
    [cycleId, weekNumber]
  );
}

export function getAllWeeklyReviews(cycleId: number): WeeklyReview[] {
  return queryAll<WeeklyReview>(
    'SELECT * FROM weekly_reviews WHERE cycle_id = ? ORDER BY week_number',
    [cycleId]
  );
}
