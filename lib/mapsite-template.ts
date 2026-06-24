export interface MapSiteSection {
  type: "hero" | "about" | "map-location" | "media" | "contact";
  title: string;
  content: Record<string, string>;
}

export function getDefaultSections(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  province?: string;
  fastCode: string;
}): MapSiteSection[] {
  const displayName = `${data.firstName} ${data.lastName}`.trim() || "MapSite Owner";

  return [
    {
      type: "hero",
      title: `${displayName}`,
      content: {
        headline: `Welcome to ${displayName}'s MapSite™`,
        subtext: "Property discovery and modular home solutions powered by TalisPros™.",
        fastCode: data.fastCode,
      },
    },
    {
      type: "about",
      title: "About",
      content: {
        description: `${displayName} is a registered TalisPros™ partner. Contact them to learn more about available properties and investment opportunities in your area.`,
      },
    },
    {
      type: "map-location",
      title: "Map Location",
      content: {
        location: [data.city, data.province].filter(Boolean).join(", ") || "Service area",
      },
    },
    {
      type: "media",
      title: "Media",
      content: {
        placeholder: "Media assets coming soon.",
      },
    },
    {
      type: "contact",
      title: "Contact",
      content: {
        email: data.email,
        phone: data.phone || "",
      },
    },
  ];
}
