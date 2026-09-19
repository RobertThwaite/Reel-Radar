import { useSyncExternalStore } from "react";

/**
 * Home-screen install state.
 *
 * The two platforms need opposite handling: Chrome hands us a deferred prompt
 * we can fire from a button, while iOS has no prompt API at all and the user
 * must go through the share sheet — which is why nobody discovers it unless
 * the app says so.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState =
  /** Already installed, dismissed, or a platform with nothing to offer. */
  | { mode: "none" }
  /** Chrome et al: we hold a deferred prompt and can install on a click. */
  | { mode: "prompt" }
  /** iOS: manual route through the share sheet. */
  | { mode: "ios" };

const DISMISS_KEY = "reel-radar:install-dismissed";

const listeners = new Set<() => void>();
let deferred: BeforeInstallPromptEvent | null = null;
let cache: InstallState | null = null;

const SERVER_STATE: InstallState = { mode: "none" };

function emit() {
  cache = null;
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppress Chrome's own mini-infobar so we can place the button ourselves.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

function dismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // Non-standard, and the only signal Safari gives us.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return true;
  // iPadOS reports itself as a Mac; the touch point count gives it away.
  return /iPad/.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
}

function compute(): InstallState {
  if (isStandalone() || dismissed()) return { mode: "none" };
  if (deferred) return { mode: "prompt" };
  if (isIOS()) return { mode: "ios" };
  return { mode: "none" };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): InstallState {
  return (cache ??= compute());
}

function getServerSnapshot(): InstallState {
  return SERVER_STATE;
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function dismissInstall() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* non-fatal */
  }
  emit();
}

/** Fires Chrome's install dialog. No-ops where there is no deferred prompt. */
export async function promptInstall() {
  if (!deferred) return;
  const event = deferred;
  await event.prompt();
  await event.userChoice;
  deferred = null;
  emit();
}
