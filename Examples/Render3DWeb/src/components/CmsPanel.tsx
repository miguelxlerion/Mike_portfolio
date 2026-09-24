"use client";

import { useState } from "react";
import type { Pin } from "@/db/schema";

type Props = {
  coords: { x: number; y: number } | null;
  placing: boolean;
  onStartPlacing: () => void;
  onCreated: (pin: Pin) => void;
};

const ACCENTS = ["#E4572E", "#1D7874", "#E8A33D", "#5B8C5A", "#B6465F", "#2F6690"];
const IMAGES = [
  "/images/mural-1.jpg",
  "/images/mural-2.jpg",
  "/images/mural-3.jpg",
  "/images/mural-4.jpg",
];

export default function CmsPanel({
  coords,
  placing,
  onStartPlacing,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    artist: "",
    category: "mural",
    year: String(new Date().getFullYear()),
    body: "",
    quote: "",
    quoteAuthor: "",
    imageUrl: IMAGES[1],
    accent: ACCENTS[0],
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const field =
    "w-full border-b border-[#f4efe6]/20 bg-transparent px-0 py-3 text-sm text-[#f4efe6] outline-none transition-colors placeholder:text-[#f4efe6]/30 focus:border-[#E4572E]";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setError("Drop the pin on the map first.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, x: coords.x, y: coords.y }),
      });
      const data = (await res.json()) as { pin?: Pin; error?: string };
      if (!res.ok || !data.pin) throw new Error(data.error ?? "Could not save");
      onCreated(data.pin);
      setStatus("done");
      setForm({ ...form, title: "", subtitle: "", body: "", quote: "", quoteAuthor: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="space-y-10">
      <p className="max-w-xl text-[15px] leading-relaxed text-[#f4efe6]/70">
        Every wall on this map was added by someone on the ground. Drop a pin on
        the aerial view, describe the intervention, and it is published to the
        colonia straight away.
      </p>

      <div className="flex flex-wrap items-center gap-4 border border-dashed border-[#f4efe6]/20 p-5">
        <button
          type="button"
          onClick={onStartPlacing}
          className="mono rounded-full border border-[#f4efe6]/40 px-6 py-3 text-[10px] uppercase tracking-[0.28em] transition-colors hover:border-[#E4572E] hover:text-[#E4572E]"
        >
          {placing ? "click the map…" : "drop a pin on the map"}
        </button>
        <span className="mono text-[10px] uppercase tracking-[0.25em] text-[#f4efe6]/45">
          {coords
            ? `position locked · x ${coords.x.toFixed(1)} · y ${coords.y.toFixed(1)}`
            : "no position yet"}
        </span>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <input
            className={field}
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className={field}
            placeholder="Location (block, alley…)"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <input
            className={field}
            placeholder="Artist / collective"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-6">
            <select
              className={`${field} [&>option]:bg-[#131110]`}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {["mural", "intervention", "public space", "light", "archive", "memory"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
            <input
              className={field}
              placeholder="Year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
        </div>

        <textarea
          className={`${field} resize-none`}
          rows={4}
          placeholder="The story of this wall…"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <input
            className={field}
            placeholder="Quote"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
          />
          <input
            className={field}
            placeholder="Quote author"
            value={form.quoteAuthor}
            onChange={(e) => setForm({ ...form, quoteAuthor: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <div>
            <span className="mono mb-3 block text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/40">
              accent
            </span>
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, accent: c })}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    form.accent === c ? "scale-110 ring-2 ring-[#f4efe6]" : "opacity-70"
                  }`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div>
            <span className="mono mb-3 block text-[9px] uppercase tracking-[0.3em] text-[#f4efe6]/40">
              image
            </span>
            <div className="flex gap-2">
              {IMAGES.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: src })}
                  className={`h-12 w-16 overflow-hidden rounded-sm transition-all ${
                    form.imageUrl === src
                      ? "ring-2 ring-[#E4572E]"
                      : "opacity-50 hover:opacity-90"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={status === "saving"}
            className="mono group relative overflow-hidden rounded-full border border-[#f4efe6]/50 px-8 py-3 text-[10px] uppercase tracking-[0.3em] disabled:opacity-40"
          >
            <span className="relative z-10 transition-colors group-hover:text-[#0d0c0b]">
              {status === "saving" ? "publishing…" : "publish to the map"}
            </span>
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-[#E4572E] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-y-100" />
          </button>
          {status === "done" && (
            <span className="mono text-[10px] uppercase tracking-[0.25em] text-[#1D7874]">
              published ✓
            </span>
          )}
          {error && <span className="mono text-[10px] text-[#E4572E]">{error}</span>}
        </div>
      </form>
    </div>
  );
}
