"use client";

import { useState } from "react";
import type { Voice } from "@/db/schema";

type Props = {
  initial: Voice[];
};

export default function VoicesPanel({ initial }: Props) {
  const [list, setList] = useState<Voice[]>(initial);
  const [form, setForm] = useState({ name: "", place: "", message: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { voice?: Voice; error?: string };
      if (!res.ok || !data.voice) throw new Error(data.error ?? "Could not save");
      setList((prev) => [data.voice as Voice, ...prev]);
      setForm({ name: "", place: "", message: "" });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const field =
    "w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none transition-colors placeholder:text-[#f4efe6]/30 focus:border-[#E4572E]";

  return (
    <div className="space-y-12">
      <p className="max-w-xl text-[15px] leading-relaxed text-[#f4efe6]/70">
        The walls of the colonia were written on for decades. This one is open on
        purpose: leave a line, from here or from anywhere, and it stays on the map.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <input
            className={field}
            placeholder="Your name"
            value={form.name}
            maxLength={80}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className={field}
            placeholder="Where are you writing from?"
            value={form.place}
            maxLength={80}
            onChange={(e) => setForm({ ...form, place: e.target.value })}
          />
        </div>
        <textarea
          className={`${field} resize-none`}
          placeholder="Your line on the wall…"
          rows={3}
          maxLength={600}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === "saving"}
            className="mono group relative overflow-hidden rounded-full border border-[#f4efe6]/50 px-8 py-3 text-[10px] uppercase tracking-[0.3em] disabled:opacity-40"
          >
            <span className="relative z-10 transition-colors group-hover:text-[#0d0c0b]">
              {status === "saving" ? "writing…" : "paint it on the wall"}
            </span>
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-[#E4572E] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-y-100" />
          </button>
          {error && <span className="mono text-[10px] text-[#E4572E]">{error}</span>}
        </div>
      </form>

      <div className="grid gap-px bg-[#f4efe6]/10 sm:grid-cols-2">
        {list.map((v) => (
          <article key={v.id} className="bg-[#131110] p-6">
            <p className="text-[15px] leading-relaxed text-[#f4efe6]/85">
              {v.message}
            </p>
            <p className="mono mt-4 text-[10px] uppercase tracking-[0.25em] text-[#f4efe6]/40">
              {v.name}
              {v.place ? ` · ${v.place}` : ""}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
