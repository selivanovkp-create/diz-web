"use client";

import { Button, ChoiceRow, Screen } from "@/components/ui";
import {
  buildCheckInPayload,
  CHECKIN_BY_WHY,
  primaryWhy,
  type SignalLevel,
} from "@/lib/plot";
import { useFormaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const CAPACITY = [
  { id: "low", label: "Мало сил" },
  { id: "ok", label: "Норм" },
  { id: "high", label: "Есть запас" },
];

export default function CheckInPage() {
  const saveCheckIn = useFormaStore((s) => s.saveCheckIn);
  const regenerateTodayPlan = useFormaStore((s) => s.regenerateTodayPlan);
  const whySelected = useFormaStore((s) => s.why.selected);
  const router = useRouter();

  const why = useMemo(() => primaryWhy(whySelected), [whySelected]);
  const plot = CHECKIN_BY_WHY[why];

  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<SignalLevel>();
  const [capacity, setCapacity] = useState<SignalLevel>();
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const focusOptions = useMemo(
    () => [
      { id: "low", label: plot.low },
      { id: "ok", label: plot.ok },
      { id: "high", label: plot.high },
    ],
    [plot],
  );

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  async function submit() {
    if (!focus || !capacity) return;
    setBusy(true);
    try {
      const payload = buildCheckInPayload({
        why,
        focus,
        capacity,
        tags,
        note,
      });
      await saveCheckIn(payload);
      // Low capacity or weak focus on the user's theme → reshape plan.
      if (capacity === "low" || focus === "low") {
        try {
          await regenerateTodayPlan();
        } catch {
          /* plan stays */
        }
      }
      router.push("/today");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <p className="text-sm text-muted">Сигнал · {plot.label}</p>
      <h1 className="font-display mt-3 text-[2.2rem] leading-tight tracking-tight">
        {plot.question}
      </h1>
      <p className="mt-2 max-w-[34ch] text-[15px] text-muted">
        Не общий wellness-опрос. Forma смотрит на твою тему из онбординга и на
        то, потянешь ли план.
      </p>

      <div className="mt-8 space-y-8">
        <div>
          <p className="mb-3 text-sm font-medium text-ink-soft">Сегодня</p>
          <ChoiceRow
            options={focusOptions}
            value={focus}
            onChange={(v) => setFocus(v as SignalLevel)}
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-ink-soft">
            Сил на сегодняшний план
          </p>
          <ChoiceRow
            options={CAPACITY}
            value={capacity}
            onChange={(v) => setCapacity(v as SignalLevel)}
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-ink-soft">
            Что ещё · по желанию
          </p>
          <div className="flex flex-wrap gap-2">
            {plot.tags.map((t) => (
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
            placeholder={plot.notePlaceholder}
            className="mt-4 w-full resize-none rounded-2xl border border-line bg-bg-elevated px-4 py-3 text-[15px] outline-none focus:border-ink"
          />
        </div>
      </div>

      <div className="mt-10 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => router.push("/today")}>
          Позже
        </Button>
        <Button
          className="flex-1"
          disabled={!focus || !capacity || busy}
          onClick={() => void submit()}
        >
          {busy ? "Сохраняю…" : "Готово"}
        </Button>
      </div>
    </Screen>
  );
}
