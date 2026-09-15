"use client";

import { Button, ChoiceRow, Screen } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MOOD = [
  { id: "low", label: "😞" },
  { id: "ok", label: "😐" },
  { id: "good", label: "🙂" },
];

const ENERGY = [
  { id: "low", label: "Мало" },
  { id: "ok", label: "Норм" },
  { id: "high", label: "Много" },
];

const SLEEP = [
  { id: "bad", label: "Плохо" },
  { id: "ok", label: "Норм" },
  { id: "good", label: "Хорошо" },
];

const TAGS = [
  "Устал",
  "Стресс",
  "Хочу курить",
  "Всё ок",
  "Нет сил на задачи",
];

function mapTriple(v: string, low: number, mid: number, high: number) {
  if (v === "low" || v === "bad") return low;
  if (v === "high" || v === "good") return high;
  return mid;
}

export default function CheckInPage() {
  const saveCheckIn = useFormaStore((s) => s.saveCheckIn);
  const regenerateTodayPlan = useFormaStore((s) => s.regenerateTodayPlan);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<string>();
  const [energy, setEnergy] = useState<string>();
  const [sleep, setSleep] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  async function submit() {
    setBusy(true);
    try {
      const moodN = mapTriple(mood || "ok", 3, 5, 8);
      const energyN = mapTriple(energy || "ok", 3, 5, 8);
      const sleepN = mapTriple(sleep || "ok", 3, 5, 8);
      const noteParts = [...tags, note.trim()].filter(Boolean);
      await saveCheckIn({
        energy: energyN,
        mood: moodN,
        sleep: sleepN,
        stress: tags.includes("Стресс") ? 7 : 4,
        activity: 4,
        focus: energyN,
        drive: energyN,
        habits: tags.includes("Хочу курить") ? 3 : 6,
        control: moodN,
        note: noteParts.join(". ") || undefined,
      });
      // Light days: ask AI to reshape plan after check-in
      if (energyN <= 4 || sleepN <= 4) {
        try {
          await regenerateTodayPlan();
        } catch {
          /* plan stays as-is */
        }
      }
      router.push("/today");
    } finally {
      setBusy(false);
    }
  }

  const canNext =
    (step === 0 && mood) ||
    (step === 1 && energy) ||
    (step === 2 && sleep) ||
    step === 3;

  return (
    <Screen>
      <p className="text-sm text-muted">Чек-ин · {step + 1} / 4</p>
      <h1 className="font-display mt-3 text-[2.2rem] leading-tight tracking-tight">
        {step === 0 && "Как настроение?"}
        {step === 1 && "Сколько энергии?"}
        {step === 2 && "Как спал?"}
        {step === 3 && "Что ещё?"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {step < 3
          ? "Один выбор — и дальше."
          : "Можно пропустить. Или отметить, что мешает."}
      </p>

      <div className="mt-10">
        {step === 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {MOOD.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setMood(o.id)}
                className={cn(
                  "flex min-h-20 items-center justify-center rounded-2xl border text-3xl transition",
                  mood === o.id
                    ? "border-ink bg-ink"
                    : "border-line bg-bg-elevated",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <ChoiceRow options={ENERGY} value={energy} onChange={setEnergy} />
        ) : null}

        {step === 2 ? (
          <ChoiceRow options={SLEEP} value={sleep} onChange={setSleep} />
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 py-2 text-sm",
                    tags.includes(t)
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-bg-elevated text-ink-soft",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Или своими словами…"
              className="w-full resize-none rounded-2xl border border-line bg-bg-elevated px-4 py-3 text-[15px] outline-none focus:border-ink"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-10 flex gap-2">
        {step > 0 ? (
          <Button variant="ghost" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Назад
          </Button>
        ) : (
          <Button variant="ghost" className="flex-1" onClick={() => router.push("/today")}>
            Позже
          </Button>
        )}
        {step < 3 ? (
          <Button
            className="flex-1"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Дальше
          </Button>
        ) : (
          <Button className="flex-1" disabled={busy} onClick={() => void submit()}>
            {busy ? "Сохраняю…" : "Готово"}
          </Button>
        )}
      </div>
    </Screen>
  );
}
