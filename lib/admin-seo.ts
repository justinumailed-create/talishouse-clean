import { createMetadata } from "./seo";

export const ADMIN_CONSOLE_METADATA = createMetadata({
  title: "Admin Console | Talispros",
  description:
    "Talispros admin console. Authorized operators sign in with a FAST code to manage site content, Mapsites, and operations.",
  path: "/admin",
  private: true,
});

export const ADMIN_LOGIN_METADATA = createMetadata({
  title: "Admin Login | Talispros",
  description:
    "Sign in to the Talispros admin console with your authorized FAST code.",
  path: "/admin/login",
  private: true,
});
