export const LEVELS: { level: number; title: string; xp: number }[] = [
  { level: 1, title: "Starting Point", xp: 0 },
  { level: 2, title: "Building Momentum", xp: 80 },
  { level: 3, title: "Getting Stronger", xp: 180 },
  { level: 4, title: "Steady Practice", xp: 320 },
  { level: 5, title: "Compounding", xp: 500 },
  { level: 6, title: "Self-System", xp: 720 },
  { level: 7, title: "High Signal", xp: 1000 },
  { level: 8, title: "Deep Consistency", xp: 1350 },
  { level: 9, title: "Quiet Discipline", xp: 1800 },
  { level: 10, title: "Long Game", xp: 2400 },
];

export function levelFromXp(xp: number) {
  let current = LEVELS[0];
  for (const row of LEVELS) {
    if (xp >= row.xp) current = row;
  }
  const next = LEVELS.find((l) => l.level === current.level + 1);
  return {
    level: current.level,
    title: current.title,
    nextXp: next?.xp ?? current.xp,
    progressToNext: next ? (xp - current.xp) / (next.xp - current.xp) : 1,
  };
}

export const ACHIEVEMENT_DEFS = [
  { key: "first_step", title: "First Step", description: "Completed your first task." },
  { key: "momentum_7", title: "Momentum", description: "Active 7 days in a row." },
  { key: "comeback", title: "Comeback", description: "Returned after a 3-day break." },
  { key: "early_win", title: "Early Win", description: "Finished a task before 9 AM." },
  { key: "no_zero_14", title: "No Zero Days", description: "Something useful every day for 14 days." },
  { key: "checkin_3", title: "Signal Lock", description: "3 daily check-ins done." },
  { key: "week_review", title: "Week Reader", description: "Opened your first weekly review." },
] as const;

export function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
}
