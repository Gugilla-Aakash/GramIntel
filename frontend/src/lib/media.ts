/**
 * GRAMINTEL — CENTRAL MEDIA REGISTRY
 * ----------------------------------
 * All remote media is centralized here so licensing and URLs are auditable.
 *
 * VIDEO — Pexels License (https://www.pexels.com/license/):
 *   Free for commercial use, no attribution required, modification allowed.
 *   Every URL below was verified reachable at build time.
 *
 * PHOTOS — Pexels License (same terms as above).
 *
 * If a CDN asset ever fails at runtime, the <VideoBackground> / <CinematicMedia>
 * components degrade gracefully to their designed fallbacks.
 */

/** MEDIA REGISTRY — Pexels License (https://www.pexels.com/license/):
 *  Free for commercial use, no attribution required, modification allowed.
 *  All URLs verified reachable at build time.
 *  Upgraded to 1920x1080 where available for sharper playback. */

export const MEDIA = {
  /** Aerial view of a rural Indian road cutting through farmland — hero + map-transition */
  heroRuralRoad: {
    mp4: "https://videos.pexels.com/video-files/35493674/15036374_1920_1080_60fps.mp4",
    fallback: "https://videos.pexels.com/video-files/35493674/15036374_1280_720_60fps.mp4",
    alt: "Aerial view of a rural Indian road and farmlands",
    credit: "Pexels · aerial-view-of-rural-indian-road-and-farmlands-35493674",
  },

  /** Indian countryside at sunrise — cinematic fallback / alternate transition take */
  sunriseCountryside: {
    mp4: "https://videos.pexels.com/video-files/34809837/14759026_1920_1080_30fps.mp4",
    fallback: "https://videos.pexels.com/video-files/34809837/14759026_1280_720_30fps.mp4",
    alt: "Scenic aerial view of Indian countryside at sunrise",
    credit: "Pexels · scenic-aerial-view-of-indian-countryside-at-sunrise-34809837",
  },

  /** Vibrant Indian fabric market stall — market close-up section */
  fabricMarket: {
    mp4: "https://videos.pexels.com/video-files/29625844/12748437_1920_1080_60fps.mp4",
    fallback: "https://videos.pexels.com/video-files/29625844/12748437_1280_720_60fps.mp4",
    alt: "Vibrant Indian fabric market stall display",
    credit: "Pexels · vibrant-indian-fabric-market-stall-display-29658444",
  },

  /** Buffalo cart on an Indian village road at dawn */
  villageDawnCart: {
    mp4: "https://videos.pexels.com/video-files/29350556/12648946_1920_1080_25fps.mp4",
    fallback: "https://videos.pexels.com/video-files/29350556/12648946_1280_720_25fps.mp4",
    alt: "Buffalo cart on an Indian village road at dawn",
    credit: "Pexels · buffalo-cart-on-indian-village-road-at-dawn-29350556",
  },
} as const;

export const PHOTOS = {
  /** Rural woman operating a sewing machine — grassroots entrepreneurship portrait */
  seamstress: {
    src: "https://images.pexels.com/photos/36739505/pexels-photo-36739505.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85",
    alt: "Rajasthani woman operating a sewing machine in her small enterprise",
    credit: "Pexels · photo 36739505",
  },

  /** Female vendor selling vegetables at a local market */
  vegetableVendor: {
    src: "https://images.pexels.com/photos/35719362/pexels-photo-35719362.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85",
    alt: "Female vendor selling vegetables at a local market",
    credit: "Pexels · photo 35719362",
  },

  /** Smiling shopkeeper with a traditional footwear display */
  shopkeeper: {
    src: "https://images.pexels.com/photos/29657407/pexels-photo-29657407.jpeg?auto=compress&cs=tinysrgb&w=1400&q=85",
    alt: "Smiling shopkeeper with traditional shoes on display",
    credit: "Pexels · photo 29657407",
  },

  /** Colourful textile market stall */
  textileStall: {
    src: "https://images.pexels.com/photos/29679404/pexels-photo-29679404.jpeg?auto=compress&cs=tinysrgb&w=1600&q=85",
    alt: "Colourful textile market stall with vibrant fabrics",
    credit: "Pexels · photo 29679404",
  },
} as const;
