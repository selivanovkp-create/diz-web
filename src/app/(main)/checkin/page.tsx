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
        eyebrow="Daily"
        title="Check-in"
        subtitle="30–60 seconds. No essays."
      />
      <div className="card space-y-5 p-4">
        {(
          [
            ["energy", "Energy"],
            ["mood", "Mood"],
            ["sleep", "Sleep"],
            ["stress", "Stress"],
            ["activity", "Movement"],
            ["focus", "Focus"],
            ["drive", "Drive"],
            ["habits", "Habits control"],
            ["control", "Life control"],
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
          <span className="mb-2 block text-sm text-ink-soft">Optional note</span>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            placeholder="Today I feel…"
            className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>
      <Button className="mt-5 w-full" disabled={busy} onClick={() => void submit()}>
        {busy ? "Saving…" : "Done"}
      </Button>
    </Screen>
  );
}
