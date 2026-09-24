"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  title: string;
  children: ReactNode;
};

export default function Overlay({ open, onClose, label, title, children }: Props) {
  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-500 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-[#0d0c0b]/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`grain absolute inset-x-0 bottom-0 top-0 mx-auto flex max-w-4xl flex-col overflow-hidden border-x border-[#f4efe6]/10 bg-[#131110] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] sm:top-10 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#f4efe6]/10 px-6 py-5 sm:px-10">
          <span className="mono text-[10px] uppercase tracking-[0.35em] text-[#E4572E]">
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="mono text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/60 transition-colors hover:text-[#f4efe6]"
          >
            close ✕
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-10 sm:px-10">
          <h2 className="display mb-8 text-5xl sm:text-7xl">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
