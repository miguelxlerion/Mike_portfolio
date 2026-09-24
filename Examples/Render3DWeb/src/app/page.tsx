import Experience from "@/components/Experience";
import { getPins, getVisitCount, getVoices } from "@/lib/pins";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pins, voices, visits] = await Promise.all([
    getPins(),
    getVoices(),
    getVisitCount(),
  ]);

  return (
    <Experience initialPins={pins} initialVoices={voices} initialVisits={visits} />
  );
}
