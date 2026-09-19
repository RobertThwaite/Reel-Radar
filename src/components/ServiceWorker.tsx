"use client";

import { useEffect } from "react";

/** Registers the service worker that makes the installed app launch instantly.
 *  Dev is skipped so a stale cache never masks what you just changed. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* the app works fine uninstalled — nothing to surface here */
      });
    };

    // Registration competes with the first paint for bandwidth; wait it out.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
