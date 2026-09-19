"use client";

import { dismissInstall, promptInstall, useInstallState } from "@/lib/install";
import { CloseIcon, ReelIcon } from "./Icons";

/**
 * A quiet nudge to install. Chrome gets a real install button; iOS gets the
 * share-sheet recipe, because Safari will never prompt on its own and most
 * people don't know the gesture exists.
 */
export function InstallHint() {
  const state = useInstallState();
  if (state.mode === "none") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="plate pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink-soft/95 p-3 shadow-2xl shadow-black/70 animate-fade-up">
        <ReelIcon className="size-7 shrink-0 text-gold" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-bone">Add to Home Screen</p>
          <p className="mt-0.5 text-xs leading-snug text-haze">
            {state.mode === "ios" ? (
              <>
                Tap <ShareGlyph /> in the toolbar, then scroll to it
              </>
            ) : (
              "Opens full screen, like an app."
            )}
          </p>
        </div>

        {state.mode === "prompt" && (
          <button
            type="button"
            onClick={promptInstall}
            className="shrink-0 rounded-full bg-gold px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:bg-bone"
          >
            Install
          </button>
        )}

        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1.5 text-haze transition hover:bg-bone/10 hover:text-bone"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** iOS share glyph, drawn inline so the instruction matches what's on screen. */
function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="the Share button"
      role="img"
      className="inline-block size-3.5 -translate-y-px text-bone"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V3.5" />
      <path d="m8.5 7 3.5-3.5L15.5 7" />
      <path d="M6 11.5H5a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7.5a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}
