import {
  CHECKIN_BY_WHY,
  buildCheckInPayload,
  focusScoreFromCheckIn,
  primaryWhy,
  type SignalLevel,
} from "@/lib/checkin-plot";
import type { LifeAreaKey, WhyOption } from "@/lib/types";

export {
  CHECKIN_BY_WHY,
  buildCheckInPayload,
  focusScoreFromCheckIn,
  primaryWhy,
  type SignalLevel,
};

export const AREA_LABELS: Record<LifeAreaKey, string> = {
  energy: "Энергия",
  sleep: "Сон",
  physical: "Движение",
  mind: "Голова",
  productivity: "Продуктивность",
  habits: "Привычки",
  social: "Социум",
  lifestyle: "Образ жизни",
};

/** Canonical onboarding goals → life area + display label. */
export const WHY_META: Record<
  WhyOption,
  { label: string; area: LifeAreaKey; coachChips: string[]; strategy: string[] }
> = {
  energy: {
    label: "Больше энергии",
    area: "energy",
    coachChips: [
      "Почему к обеду нет сил?",
      "Как поднять день без героизма?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Поднимать энергию через режим, а не через мотивацию",
      "Короткие якоря утра без героизма",
    ],
  },
  sleep: {
    label: "Нормальный сон",
    area: "sleep",
    coachChips: [
      "Почему плохо сплю?",
      "Как раньше засыпать?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Стабилизировать время отхода ко сну",
      "Убрать экран перед сном маленькими шагами",
    ],
  },
  smoking: {
    label: "Бросить / меньше курить",
    area: "habits",
    coachChips: [
      "Как пережить тягу?",
      "Что делать после срыва?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Сжимать окна без никотина, не «бросить навсегда» за день",
      "Фиксировать срывы без самобичевания",
    ],
  },
  fitness: {
    label: "Движение и тело",
    area: "physical",
    coachChips: [
      "Как начать двигаться без зала?",
      "Почему бросаю тренировки?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Движение скучно-простое, чтобы повторялось",
      "Встраивать короткие сессии в день, а не «идеальный зал»",
    ],
  },
  stress: {
    label: "Меньше стресса",
    area: "mind",
    coachChips: [
      "Голова не отпускает — что делать?",
      "Как снизить нагрузку сегодня?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Снимать шум в голове короткими ритуалами",
      "Урезать день, когда стресс высокий",
    ],
  },
  productivity: {
    label: "Фокус и работа",
    area: "productivity",
    coachChips: [
      "Почему откладываю важное?",
      "Как собрать день?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Один завершённый кусок вместо идеального дня",
      "Убирать отвлечения маленькими правилами",
    ],
  },
  discipline: {
    label: "Дисциплина и ритм",
    area: "habits",
    coachChips: [
      "Почему срываюсь на 3-й день?",
      "Как держать ритм?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Ритм важнее идеала — не обнулять день",
      "Минимум, который невозможно не сделать",
    ],
  },
  nutrition: {
    label: "Питание",
    area: "lifestyle",
    coachChips: [
      "Как есть ровнее без срывов?",
      "Что делать с вечерним голодом?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Ровный ритм еды важнее жёсткой диеты",
      "Один спокойный приём пищи без экрана",
    ],
  },
  alcohol: {
    label: "Алкоголь",
    area: "habits",
    coachChips: [
      "Как пережить вечер без выпивки?",
      "Что делать, если тянет?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Сужать окна без алкоголя, не обещать «никогда»",
      "Заранее готовить замену ритуалу «после работы»",
    ],
  },
  relationships: {
    label: "Отношения",
    area: "social",
    coachChips: [
      "Как не закрываться в себе?",
      "С чего начать общение?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Один живой контакт важнее идеальной социальности",
      "Маленькие шаги к людям без давления",
    ],
  },
  confidence: {
    label: "Уверенность",
    area: "mind",
    coachChips: [
      "Почему сравниваю себя с другими?",
      "Как спокойнее относиться к оценке?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Меньше сравнений — больше маленьких доказательств себе",
      "Действие важнее самокритики",
    ],
  },
  focus: {
    label: "Концентрация",
    area: "productivity",
    coachChips: [
      "Почему не могу усидеть без телефона?",
      "Как собрать внимание?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Короткие окна фокуса без героизма",
      "Убирать один источник шума за раз",
    ],
  },
  appearance: {
    label: "Внешний вид",
    area: "lifestyle",
    coachChips: [
      "Что делать, если тяжело смотреть в зеркало?",
      "Как ухаживать за собой без срыва?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Забота о теле маленькими ежедневными шагами",
      "Питание и движение как поддержка вида, не наказание",
    ],
  },
  other: {
    label: "Другое",
    area: "lifestyle",
    coachChips: [
      "С чего мне начать?",
      "Что мешает сильнее всего?",
      "Что мне делать сегодня?",
    ],
    strategy: [
      "Начать с одного ясного направления",
      "Не чинить всё сразу",
    ],
  },
};

export function whyToArea(why: WhyOption): LifeAreaKey {
  return WHY_META[why].area;
}

export function whyLabel(why: WhyOption): string {
  return WHY_META[why].label;
}

export function whyLabels(selected: WhyOption[]): string {
  if (!selected.length) return WHY_META.other.label;
  return selected.map(whyLabel).join(", ");
}

export function whyAreas(selected: WhyOption[]): LifeAreaKey[] {
  return selected.map(whyToArea);
}

export function coachChipsFor(selected: WhyOption[]): string[] {
  const why = primaryWhy(selected);
  return WHY_META[why].coachChips;
}

export function strategiesFor(selected: WhyOption[]): string[] {
  const goals = selected.length ? selected : (["other"] as WhyOption[]);
  const lines: string[] = [];
  for (const g of goals) {
    for (const s of WHY_META[g].strategy) {
      if (!lines.includes(s)) lines.push(s);
    }
  }
  lines.push("Снизить перегрузку, не геройствовать");
  return lines.slice(0, 4);
}

export type PlotTask = {
  title: string;
  detail?: string;
  duration: number;
  difficulty: number;
  category: string;
  why: string;
  xp: number;
  steps?: string[];
  doneWhen?: string;
  tip?: string;
};

/** Tasks keyed by WhyOption — never collapse smoking/alcohol/discipline into one nicotine pack. */
export function tasksForWhy(
  why: WhyOption,
  tiny: boolean,
  minutes: number,
): PlotTask[] {
  const easy = tiny || minutes <= 15;
  const banks: Record<WhyOption, PlotTask[]> = {
    energy: [
      {
        title: "Стакан воды в первые 10 минут после подъёма",
        duration: 2,
        difficulty: 1,
        category: "energy",
        why: "Маленький якорь утра без героизма.",
        xp: 8,
      },
      {
        title: easy ? "5 минут на воздухе" : "12 минут прогулки",
        detail: "Неважно куда. Цель — просто выйти.",
        duration: easy ? 5 : 12,
        difficulty: easy ? 1 : 2,
        category: "movement",
        why: "Короткое движение поднимает ресурс быстрее кофе.",
        xp: 14,
      },
      {
        title: "Один блок без уведомлений — 25 минут",
        duration: 25,
        difficulty: 2,
        category: "focus",
        why: "Меньше шума — больше энергии к концу дня.",
        xp: 12,
      },
    ],
    sleep: [
      {
        title: easy ? "Ляг на 15 мин раньше обычного" : "Ляг до 00:30",
        detail: "Не идеальный сон. Просто чуть раньше.",
        duration: 1,
        difficulty: 1,
        category: "sleep",
        why: "Сон сейчас даёт больше эффекта, чем ещё одна привычка.",
        xp: 12,
      },
      {
        title: "Телефон на зарядку вне кровати",
        duration: 2,
        difficulty: 1,
        category: "sleep",
        why: "Меньше позднего света — легче уснуть.",
        xp: 10,
      },
      {
        title: "2 минуты без экрана перед сном",
        duration: 2,
        difficulty: 1,
        category: "sleep",
        why: "Маленький ритуал вместо идеального режима.",
        xp: 8,
      },
    ],
    smoking: [
      {
        title: "Не курить первые 60 минут после подъёма",
        detail: "Не «бросить навсегда». Только первый час.",
        duration: 60,
        difficulty: 2,
        category: "habits",
        why: "Утренний никотин сильнее закрепляет зависимость.",
        xp: 18,
      },
      {
        title: "Вода вместо одной сигареты",
        duration: 3,
        difficulty: 2,
        category: "habits",
        why: "Один заменённый импульс — уже данные, не героизм.",
        xp: 12,
      },
      {
        title: "Отметь тягу без самокритики",
        duration: 2,
        difficulty: 1,
        category: "habits",
        why: "Данные важнее вины.",
        xp: 8,
      },
    ],
    fitness: [
      {
        title: easy ? "Пройди 8 минут после еды" : "20 минут ходьбы",
        duration: easy ? 8 : 20,
        difficulty: easy ? 1 : 2,
        category: "movement",
        detail: "После обеда или ужина. Без маршрута.",
        why: "Движение должно быть скучно-простым, чтобы повторялось.",
        xp: 14,
      },
      {
        title: "10 приседаний у стены — без перфекционизма",
        duration: 3,
        difficulty: 1,
        category: "movement",
        why: "Маленький контакт с телом важнее идеальной тренировки.",
        xp: 10,
      },
    ],
    stress: [
      {
        title: "Запиши 1 фразу: что сегодня давит",
        duration: 2,
        difficulty: 1,
        category: "mind",
        why: "Названное напряжение занимает меньше места.",
        xp: 10,
      },
      {
        title: "3 медленных выдоха перед следующим делом",
        duration: 1,
        difficulty: 1,
        category: "mind",
        why: "Короткий сброс без медитационного перфекционизма.",
        xp: 8,
      },
    ],
    productivity: [
      {
        title: "Выбери одно дело на 15 минут — и только его",
        duration: 15,
        difficulty: 2,
        category: "focus",
        why: "Дисциплина растёт из коротких завершённых циклов.",
        xp: 14,
      },
      {
        title: "Убери 5 лишних вкладок с главного экрана",
        duration: 5,
        difficulty: 1,
        category: "focus",
        why: "Меньше входов в хаос — легче начать.",
        xp: 8,
      },
    ],
    discipline: [
      {
        title: "Сделай одно обещание себе на 10 минут",
        duration: 10,
        difficulty: 2,
        category: "habits",
        why: "Ритм держится на завершённых мини-циклах.",
        xp: 14,
      },
      {
        title: "Отметь день как «не обнулил» — даже за 1 шаг",
        duration: 1,
        difficulty: 1,
        category: "habits",
        why: "Не обнулять день важнее идеальной серии.",
        xp: 8,
      },
    ],
    nutrition: [
      {
        title: "Один нормальный приём пищи без телефона",
        duration: 15,
        difficulty: 1,
        category: "lifestyle",
        why: "Спокойная еда снижает вечерние срывы.",
        xp: 10,
      },
      {
        title: "Вода до кофе / перекуса",
        duration: 2,
        difficulty: 1,
        category: "lifestyle",
        why: "Маленький якорь до автопилота.",
        xp: 8,
      },
    ],
    alcohol: [
      {
        title: "Один вечерний ритуал без алкоголя",
        detail: "Чай, душ или прогулка — заранее выбранная замена.",
        duration: 15,
        difficulty: 2,
        category: "habits",
        why: "Замена ритуала сильнее обещания «никогда».",
        xp: 16,
      },
      {
        title: "Отметь тягу, не борясь с ней текстом",
        duration: 2,
        difficulty: 1,
        category: "habits",
        why: "Заметить импульс — уже не автопилот.",
        xp: 8,
      },
    ],
    relationships: [
      {
        title: "Одно короткое сообщение человеку, которого откладывал",
        duration: 3,
        difficulty: 1,
        category: "social",
        why: "Маленький контакт важнее идеальной близости.",
        xp: 10,
      },
      {
        title: "5 минут живого внимания без телефона",
        duration: 5,
        difficulty: 1,
        category: "social",
        why: "Присутствие — базовая валюта отношений.",
        xp: 10,
      },
    ],
    confidence: [
      {
        title: "Запиши 1 факт «я сделал», без оценки",
        duration: 3,
        difficulty: 1,
        category: "mind",
        why: "Доказательства себе сильнее сравнений.",
        xp: 10,
      },
      {
        title: "10 минут без ленты сравнений",
        duration: 10,
        difficulty: 2,
        category: "mind",
        why: "Меньше топлива для самокритики.",
        xp: 12,
      },
    ],
    focus: [
      {
        title: "15 минут одного дела — телефон в другой комнате",
        duration: 15,
        difficulty: 2,
        category: "focus",
        why: "Расстояние до телефона важнее силы воли.",
        xp: 14,
      },
      {
        title: "Закрой все вкладки кроме одной рабочей",
        duration: 3,
        difficulty: 1,
        category: "focus",
        why: "Один вход — меньше рассеивания.",
        xp: 8,
      },
    ],
    appearance: [
      {
        title: easy ? "5 минут ухода за собой" : "Короткий уход + 10 минут ходьбы",
        detail: "Душ, лицо, одежда — что угодно из заботы о теле.",
        duration: easy ? 5 : 15,
        difficulty: 1,
        category: "lifestyle",
        why: "Забота о виде начинается с маленького контакта с собой.",
        xp: 12,
      },
      {
        title: "Один спокойный приём пищи без экрана",
        duration: 15,
        difficulty: 1,
        category: "lifestyle",
        why: "Питание и вид связаны сильнее, чем ещё одна диета.",
        xp: 10,
      },
      {
        title: "Запиши 1 шаг для тела без критики зеркала",
        duration: 2,
        difficulty: 1,
        category: "mind",
        why: "Действие важнее оценки отражения.",
        xp: 8,
      },
    ],
    other: [
      {
        title: "Запиши одной фразой: что меняешь и зачем",
        duration: 3,
        difficulty: 1,
        category: "lifestyle",
        why: "Ясность направления важнее идеального плана.",
        xp: 10,
      },
      {
        title: "Одно действие меньше 5 минут по этой теме",
        duration: 5,
        difficulty: 1,
        category: "lifestyle",
        why: "Не обнулить день — уже прогресс.",
        xp: 8,
      },
    ],
  };
  return banks[why];
}

export function taskWhyFallback(category?: string, why?: WhyOption): string {
  if (why) {
    const map: Partial<Record<WhyOption, string>> = {
      appearance: "Маленький шаг к тому, как ты хочешь себя видеть и чувствовать.",
      smoking: "Сужает автопилот курения — без обещания «навсегда».",
      alcohol: "Ломает вечерний автопилот без героизма.",
      sleep: "Чинит базу — завтра будет легче держать день.",
      energy: "Поднимает дневной ресурс без героизма.",
      fitness: "Короткое движение снимает застой.",
      nutrition: "Ровнее еда — меньше срывов вечером.",
      stress: "Снимает шум в голове, чтобы осталось место на важное.",
      confidence: "Доказательство себе важнее чужой оценки.",
      focus: "Собирает внимание в один короткий цикл.",
      productivity: "Один завершённый кусок даёт ощущение контроля.",
      discipline: "Ритм важнее идеала.",
      relationships: "Маленький контакт с людьми важнее идеальной близости.",
    };
    if (map[why]) return map[why]!;
  }
  const byCat: Record<string, string> = {
    energy: "Поднимает дневной ресурс без героизма.",
    sleep: "Чинит базу — завтра будет легче держать день.",
    physical: "Короткое движение снимает застой.",
    movement: "Короткое движение снимает застой.",
    mind: "Снимает шум в голове, чтобы осталось место на важное.",
    productivity: "Один завершённый кусок даёт ощущение контроля.",
    focus: "Собирает внимание в один короткий цикл.",
    habits: "Маленький отказ от автопилота — и день уже другой.",
    social: "Контакт с людьми обычно возвращает опору.",
    lifestyle: "Мелочь в режиме, которая складывается в систему.",
  };
  return (
    byCat[category || ""] ||
    "Маленький шаг, который Forma выбрала под твою тему из онбординга."
  );
}
