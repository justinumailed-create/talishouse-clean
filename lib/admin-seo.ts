import { createMetadata } from "./seo";

export const ADMIN_CONSOLE_METADATA = createMetadata({
  title: "Admin Console | Tsplits™",
  description:
    "Tsplits™ admin console. Authorized operators sign in with a FAST code to manage site content, Mapsites, and operations.",
  path: "/admin",
  private: true,
});

export const ADMIN_LOGIN_METADATA = createMetadata({
  title: "Admin Login | Tsplits™",
  description:
    "Sign in to the Tsplits™ admin console with your authorized FAST code.",
  path: "/admin/login",
  private: true,
});
