import type { MetadataRoute } from "next";

/** Served at /manifest.webmanifest. This is what makes "Add to Home Screen"
 *  produce a standalone app rather than a browser bookmark. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reel Radar — where to watch",
    short_name: "Reel Radar",
    description: "Search any film and see which streaming services have it in your country.",
    // Pins the app's identity: without it, Chrome derives identity from
    // start_url, so changing that would register as a different app and
    // orphan everyone's existing install.
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#070709",
    theme_color: "#070709",
    categories: ["entertainment", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops these to its own shape, so the reel sits in the safe zone.
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Chrome on Android shows a richer, store-like install dialog when
    // screenshots are present, and a bare one when they aren't. These show the
    // search surfaces rather than a result panel — an install card shouldn't
    // advertise availability figures.
    screenshots: [
      {
        src: "/screenshots/mobile-search.webp",
        sizes: "540x1168",
        type: "image/webp",
        form_factor: "narrow",
        label: "Search any film from your phone",
      },
      {
        src: "/screenshots/mobile-autocomplete.webp",
        sizes: "540x1168",
        type: "image/webp",
        form_factor: "narrow",
        label: "Autocomplete with posters, years and ratings",
      },
      {
        src: "/screenshots/desktop-autocomplete.webp",
        sizes: "1280x800",
        type: "image/webp",
        form_factor: "wide",
        label: "Reel Radar on the desktop",
      },
    ],
  };
}
