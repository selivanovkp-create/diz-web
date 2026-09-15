const CRISIS_PATTERNS = [
  /suicid/i,
  /kill myself/i,
  /end my life/i,
  /self[-\s]?harm/i,
  /hurt myself/i,
  /не хочу жить/i,
  /убить себя/i,
  /суицид/i,
];

const MEDICAL_PATTERNS = [
  /diagnos/i,
  /prescription/i,
  /medication dose/i,
  /chest pain/i,
  /can't breathe/i,
  /heart attack/i,
  /диагноз/i,
  /таблетк/i,
  /боль в груди/i,
];

export function detectSafetyRisk(text: string): {
  crisis: boolean;
  medical: boolean;
} {
  return {
    crisis: CRISIS_PATTERNS.some((p) => p.test(text)),
    medical: MEDICAL_PATTERNS.some((p) => p.test(text)),
  };
}

export function safetyCoachReply(kind: "crisis" | "medical"): string {
  if (kind === "crisis") {
    return "То, что ты описываешь, звучит тяжело — и это уже за пределами того, чем FORMA может помочь. Пожалуйста, обратись к человеку рядом или к специалистам. Если тебе опасно сейчас — свяжись с экстренной помощью. Я рядом для маленьких ежедневных шагов, но не заменяю профессиональную поддержку.";
  }
  return "Это уже похоже на вопрос к врачу, а не к wellness-приложению. Я не ставлю диагнозы и не назначаю лечение. Если симптомы сильные или пугают — лучше проверить это с специалистом. Здесь можем держать фокус на режиме, сне и посильных привычках.";
}
