"use client";

import { Button, Screen, SectionTitle, SliderField } from "@/components/ui";
import { useFormaStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckInPage() {
  const saveCheckIn = useFormaStore((s) => s.saveCheckIn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    energy: 5,
    mood: 5,
    sleep: 5,
    stress: 5,
    activity: 4,
    focus: 5,
    drive: 4,
    habits: 5,
    control: 5,
    note: "",
  });

  async function submit() {
    setBusy(true);
    await saveCheckIn(form);
    setBusy(false);
    router.push("/today");
  }

  return (
    <Screen>
      <SectionTitle
        eyebrow="Ежедневно"
        title="Чек-ин"
        subtitle="30–60 секунд. Без эссе."
      />
      <div className="card space-y-5 p-4">
        {(
          [
            ["energy", "Энергия"],
            ["mood", "Настроение"],
            ["sleep", "Сон"],
            ["stress", "Стресс"],
            ["activity", "Движение"],
            ["focus", "Фокус"],
            ["drive", "Драйв"],
            ["habits", "Контроль привычек"],
            ["control", "Контроль над жизнью"],
          ] as const
        ).map(([key, label]) => (
          <SliderField
            key={key}
            label={label}
            value={form[key]}
            onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
          />
        ))}
        <label className="block">
          <span className="mb-2 block text-sm text-ink-soft">Заметка (по желанию)</span>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            placeholder="Сегодня я чувствую…"
            className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>
      <Button className="mt-5 w-full" disabled={busy} onClick={() => void submit()}>
        {busy ? "Сохраняю…" : "Готово"}
      </Button>
    </Screen>
  );
}
