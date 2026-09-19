import type { MetadataRoute } from "next";

/** Served at /manifest.webmanifest. This is what makes "Add to Home Screen"
 *  produce a standalone app rather than a browser bookmark. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reel Radar — where to watch",
    short_name: "Reel Radar",
    description: "Search any film and see which streaming services have it in your country.",
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
  };
}
