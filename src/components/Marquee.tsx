import { Asterisk } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { TechIcon } from "./TechIcon";

export default function Marquee() {
  const { content } = useSite();
  if (!content.appearance.showMarquee) return null;
  const items = [...content.marquee, ...content.marquee];
  return (
    <div className="group overflow-hidden border-y border-white/10 bg-coal py-4" aria-hidden>
      <div className="flex w-max animate-marquee gap-8 group-hover:[animation-play-state:paused]">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-3 font-display text-lg font-bold uppercase tracking-wide text-zinc-400">
            <TechIcon name={item} className="h-5 w-5" />
            {item}
            <Asterisk className="h-5 w-5 text-acid" />
          </span>
        ))}
      </div>
    </div>
  );
}
