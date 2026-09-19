import { Suspense } from "react";
import { Finder } from "@/components/Finder";
import { ReelIcon } from "@/components/Icons";

export default function Home() {
  return (
    <Suspense fallback={<Curtain />}>
      <Finder />
    </Suspense>
  );
}

/** Held only for the instant before the client reads the URL — deliberately
 *  quiet so it reads as the page settling rather than a loading screen. */
function Curtain() {
  return (
    <div className="relative z-10 flex min-h-screen-safe items-center justify-center">
      <ReelIcon className="size-8 animate-spin text-gold/50 [animation-duration:2.5s]" />
    </div>
  );
}
