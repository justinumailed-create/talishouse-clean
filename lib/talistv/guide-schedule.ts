/**
 * TalisTV™ guide schedule — demo lineup for the TV-guide surface.
 * Times are local wall-clock labels; shows align 1:1 with each slot.
 */

export interface TalisTvGuideShow {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  category: string;
  /** Optional live / now / upcoming badge. */
  status?: "live" | "up-next" | "later";
}

export interface TalisTvGuideSlot {
  id: string;
  timeLabel: string;
  show: TalisTvGuideShow;
}

/** Evening guide block — times on the left, shows on the right. */
export const TALISTV_GUIDE_SLOTS: TalisTvGuideSlot[] = [
  {
    id: "slot-1800",
    timeLabel: "6:00",
    show: {
      id: "show-open",
      title: "Market Open",
      subtitle: "Daily briefing across featured Mapsites™",
      durationMinutes: 30,
      category: "News",
      status: "later",
    },
  },
  {
    id: "slot-1830",
    timeLabel: "6:30",
    show: {
      id: "show-walkthrough",
      title: "Walkthrough Live",
      subtitle: "Agent-led tour · coastal lot package",
      durationMinutes: 30,
      category: "Tour",
      status: "live",
    },
  },
  {
    id: "slot-1900",
    timeLabel: "7:00",
    show: {
      id: "show-builder",
      title: "Builder Spotlight",
      subtitle: "Modular homes · Talishouse™ lineup",
      durationMinutes: 45,
      category: "Feature",
      status: "up-next",
    },
  },
  {
    id: "slot-1945",
    timeLabel: "7:45",
    show: {
      id: "show-fast",
      title: "FAST Code™ Stories",
      subtitle: "Claimed markets and owner journeys",
      durationMinutes: 30,
      category: "Series",
    },
  },
  {
    id: "slot-2015",
    timeLabel: "8:15",
    show: {
      id: "show-mls",
      title: "MLS® Desk",
      subtitle: "Listings desk with live inventory notes",
      durationMinutes: 30,
      category: "Desk",
    },
  },
  {
    id: "slot-2045",
    timeLabel: "8:45",
    show: {
      id: "show-teb",
      title: "Talisbooks™ Preview",
      subtitle: "Lookbook pages from tonight’s featured pin",
      durationMinutes: 30,
      category: "Preview",
    },
  },
  {
    id: "slot-2115",
    timeLabel: "9:15",
    show: {
      id: "show-night",
      title: "Night Listing",
      subtitle: "Extended cut · vacant land & waterfront",
      durationMinutes: 45,
      category: "Late",
    },
  },
  {
    id: "slot-2200",
    timeLabel: "10:00",
    show: {
      id: "show-close",
      title: "Sign-Off Reel",
      subtitle: "Highlights reel and tomorrow’s lineup",
      durationMinutes: 15,
      category: "Close",
    },
  },
];

export const TALISTV_GUIDE_CHANNEL = {
  callSign: "TTV",
  name: "TalisTV™",
  tagline: "Video shelf for the Talispros™ ecosystem",
} as const;
