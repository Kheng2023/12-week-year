/**
 * Seed the database with realistic demo data so the app isn't empty on first visit.
 * Only runs when no cycles exist.
 */
import { getDb, saveDb } from './database';

// ─── Helpers ────────────────────────────────────────────

function run(sql: string, params: (string | number | null)[] = []): void {
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

function lastId(): number {
  const db = getDb();
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const row = stmt.getAsObject() as { id: number };
  stmt.free();
  return row.id;
}

function isEmpty(): boolean {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as n FROM cycles');
  stmt.step();
  const row = stmt.getAsObject() as { n: number };
  stmt.free();
  return row.n === 0;
}

// ─── Demo Data ──────────────────────────────────────────

/** Deterministic pseudo-random based on seed so demo looks consistent */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export async function seedDemoData(): Promise<void> {
  if (!isEmpty()) return;

  const rand = seededRandom(42);

  // Create a cycle starting Jan 5, 2026 (Monday)
  run(
    'INSERT INTO cycles (title, start_date, end_date, vision, is_active) VALUES (?, ?, ?, ?, 1)',
    [
      'Q1 2026 — Growth Sprint',
      '2026-01-05',
      '2026-03-29',
      'By the end of these 12 weeks I will have built a consistent fitness routine, shipped v1 of my side project, and developed a daily learning habit. I will feel energised, productive, and proud of the progress I\'ve made.',
    ]
  );
  const cycleId = lastId();

  // ─── Goal 1: Fitness ────────────────────────────────
  run('INSERT INTO goals (cycle_id, title, description, sort_order) VALUES (?, ?, ?, ?)', [
    cycleId,
    'Build a Consistent Fitness Habit',
    'Establish a sustainable workout routine and improve overall health markers.',
    0,
  ]);
  const g1 = lastId();

  const tactics: { goalId: number; title: string; target: number }[] = [
    { goalId: g1, title: 'Morning workout (30 min)', target: 5 },
    { goalId: g1, title: 'Hit 10,000 steps', target: 7 },
    { goalId: g1, title: 'Meal prep for the week', target: 2 },
  ];

  // ─── Goal 2: Side Project ──────────────────────────
  run('INSERT INTO goals (cycle_id, title, description, sort_order) VALUES (?, ?, ?, ?)', [
    cycleId,
    'Ship Side Project v1',
    'Launch the minimum viable product of my personal app and get 10 beta users.',
    1,
  ]);
  const g2 = lastId();

  tactics.push(
    { goalId: g2, title: 'Code for 1 hour', target: 5 },
    { goalId: g2, title: 'Write a dev blog post', target: 1 },
    { goalId: g2, title: 'Review & merge PRs', target: 3 },
  );

  // ─── Goal 3: Learning ─────────────────────────────
  run('INSERT INTO goals (cycle_id, title, description, sort_order) VALUES (?, ?, ?, ?)', [
    cycleId,
    'Develop a Daily Learning Habit',
    'Read every day, complete an online course, and expand my professional network.',
    2,
  ]);
  const g3 = lastId();

  tactics.push(
    { goalId: g3, title: 'Read for 30 minutes', target: 7 },
    { goalId: g3, title: 'Complete one course lesson', target: 3 },
    { goalId: g3, title: 'Reach out to someone new', target: 2 },
  );

  // Insert tactics and collect IDs
  const tacticIds: { id: number; target: number }[] = [];
  let sortOrder = 0;
  for (const t of tactics) {
    // Reset sort_order per goal
    if (tacticIds.length === 3 || tacticIds.length === 6) sortOrder = 0;
    run('INSERT INTO tactics (goal_id, title, weekly_target, sort_order) VALUES (?, ?, ?, ?)', [
      t.goalId,
      t.title,
      t.target,
      sortOrder++,
    ]);
    tacticIds.push({ id: lastId(), target: t.target });
  }

  // ─── Weekly Scores (weeks 1-8, simulating ~8 weeks of use) ─
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  for (let week = 1; week <= 8; week++) {
    for (const tactic of tacticIds) {
      // Simulate improving execution over time with some variance
      // Base probability of doing a day increases from ~55% in week 1 to ~85% in week 8
      const baseProb = 0.50 + (week / 12) * 0.40;
      // Add some per-tactic and per-week noise
      const days: Record<string, number> = {};
      let daysChecked = 0;

      for (const day of DAYS) {
        const roll = rand();
        // Skip some weekend days more often (realistic)
        const weekendPenalty = (day === 'sat' || day === 'sun') ? 0.15 : 0;
        const done = roll < (baseProb - weekendPenalty) && daysChecked < tactic.target + 1;
        days[day] = done ? 1 : 0;
        if (done) daysChecked++;
      }

      run(
        `INSERT INTO weekly_scores (cycle_id, week_number, tactic_id, sun, mon, tue, wed, thu, fri, sat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cycleId, week, tactic.id, days.sun, days.mon, days.tue, days.wed, days.thu, days.fri, days.sat]
      );
    }
  }

  // ─── Weekly Reviews (a few filled in) ─────────────────────
  const reviews = [
    {
      week: 1,
      wins: 'Got the workout habit started — completed 4 out of 5 planned sessions. Set up the project repo and wrote the first feature.',
      improvements: 'Meal prep only happened once. Need to block Sunday afternoon for this.',
      insights: 'Starting is the hardest part. Once I began, momentum carried me through.',
    },
    {
      week: 2,
      wins: 'Hit 10k steps every day! First blog post drafted. Read every single day.',
      improvements: 'Coding sessions were shorter than planned. Need to silence notifications during deep work.',
      insights: 'Consistency beats intensity. Small daily actions are adding up.',
    },
    {
      week: 4,
      wins: 'Best execution week so far — 88% score. Side project has 3 core features working. Reached out to 2 potential beta testers.',
      improvements: 'Still struggling with weekend workouts. Should switch to outdoor activities on weekends.',
      insights: 'The scorecard is really motivating. Seeing the numbers makes me want to keep the streak going.',
    },
    {
      week: 6,
      wins: 'Completed half the online course! Fitness is feeling like a genuine habit now, not a chore.',
      improvements: 'Blog post cadence slipped — only wrote one in the last 3 weeks. Need to timebox writing to Thursday evenings.',
      insights: 'Week 6 = halfway point. Reviewing my vision statement reminded me why I started. Feeling re-energised.',
    },
    {
      week: 8,
      wins: 'Side project MVP is feature-complete! Got 4 people to sign up for beta. Reading streak is at 50+ days.',
      improvements: 'Networking goal has been inconsistent. Quality over quantity — should focus on deeper conversations.',
      insights: 'The compound effect is real. 8 weeks of small daily actions has produced visible results across all three goals.',
    },
  ];

  for (const r of reviews) {
    run(
      `INSERT INTO weekly_reviews (cycle_id, week_number, wins, improvements, insights)
       VALUES (?, ?, ?, ?, ?)`,
      [cycleId, r.week, r.wins, r.improvements, r.insights]
    );
  }

  await saveDb();
  console.log('Demo data seeded successfully.');
}
