export const LEVELS: { level: number; title: string; xp: number }[] = [
  { level: 1, title: "Точка старта", xp: 0 },
  { level: 2, title: "Набираем темп", xp: 80 },
  { level: 3, title: "Становимся сильнее", xp: 180 },
  { level: 4, title: "Стабильная практика", xp: 320 },
  { level: 5, title: "Сложный процент", xp: 500 },
  { level: 6, title: "Своя система", xp: 720 },
  { level: 7, title: "Чёткий сигнал", xp: 1000 },
  { level: 8, title: "Глубокая стабильность", xp: 1350 },
  { level: 9, title: "Тихая дисциплина", xp: 1800 },
  { level: 10, title: "Длинная игра", xp: 2400 },
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
  { key: "first_step", title: "Первый шаг", description: "Выполнил первую задачу." },
  { key: "momentum_7", title: "Momentum", description: "Активен 7 дней подряд." },
  { key: "comeback", title: "Возвращение", description: "Вернулся после паузы в 3 дня." },
  { key: "early_win", title: "Ранний заход", description: "Закрыл задачу до 9:00." },
  { key: "no_zero_14", title: "Без нулевых дней", description: "Делал полезное каждый день 14 дней." },
  { key: "checkin_3", title: "Сигнал пойман", description: "Сделал 3 ежедневных чек-ина." },
  { key: "week_review", title: "Читатель недели", description: "Открыл первый недельный обзор." },
] as const;

export function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
}
