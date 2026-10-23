import { describe, expect, it } from "vitest";
import {
  agentChangePasswordPath,
  agentLoginPath,
  agentReturnFromSearchParams,
  isAgentPortalPath,
  safeAgentReturnPath,
} from "../lib/agent-return-path";
import { resolveAdminRequestGate } from "../lib/admin-request-gate";

describe("agent portal return path", () => {
  it("recognises only /admin/agent and its children", () => {
    expect(isAgentPortalPath("/admin/agent")).toBe(true);
    expect(isAgentPortalPath("/admin/agent/leads/new")).toBe(true);
    expect(isAgentPortalPath("/admin/agents")).toBe(false);
    expect(isAgentPortalPath("/admin/agentx")).toBe(false);
    expect(isAgentPortalPath("/admin/leads")).toBe(false);
  });

  it("accepts same-origin agent portal paths with query", () => {
    expect(safeAgentReturnPath("/admin/agent/leads")).toBe("/admin/agent/leads");
    expect(safeAgentReturnPath("/admin/agent/leads/abc-123?tab=notes")).toBe(
      "/admin/agent/leads/abc-123?tab=notes",
    );
  });

  it("rejects open redirects and paths outside the portal", () => {
    for (const bad of [
      "https://evil.example/admin/agent",
      "//evil.example/admin/agent",
      "/\\evil.example/admin/agent",
      "\\\\evil.example",
      "javascript:alert(1)",
      "/admin/agents",
      "/admin/agentevil",
      "/admin/dashboard",
      "/admin/agent/../dashboard",
      "/admin/agent/%2e%2e/dashboard",
      "/admin/agent/%2F%2Fevil.example",
      "/admin/agent\n/x",
      "admin/agent",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(safeAgentReturnPath(bad)).toBeNull();
    }
  });

  it("builds login and change-password links only with safe returns", () => {
    expect(agentLoginPath("/admin/agent/leads")).toBe("/agent/login?next=%2Fadmin%2Fagent%2Fleads");
    expect(agentLoginPath("https://evil.example")).toBe("/agent/login");
    expect(agentLoginPath()).toBe("/agent/login");
    expect(agentChangePasswordPath("/admin/agent/leads/new")).toBe(
      "/agent/change-password?next=%2Fadmin%2Fagent%2Fleads%2Fnew",
    );
    expect(agentChangePasswordPath("//evil")).toBe("/agent/change-password");
    expect(agentReturnFromSearchParams({ next: ["/admin/agent/leads", "/x"] })).toBe("/admin/agent/leads");
    expect(agentReturnFromSearchParams({ next: "/admin/dashboard" })).toBeNull();
  });
});

describe("admin request gate for the agent portal", () => {
  it("sends signed-out agent portal visitors to /agent/login with a return path", () => {
    expect(resolveAdminRequestGate({ pathname: "/admin/agent/leads" })).toEqual({
      action: "redirect",
      to: "/agent/login?next=%2Fadmin%2Fagent%2Fleads",
    });
    expect(resolveAdminRequestGate({ pathname: "/admin/agent/leads/new" })).toEqual({
      action: "redirect",
      to: "/agent/login?next=%2Fadmin%2Fagent%2Fleads%2Fnew",
    });
    expect(
      resolveAdminRequestGate({ pathname: "/admin/agent/leads/abc", search: "?edit=1" }),
    ).toEqual({ action: "redirect", to: "/agent/login?next=%2Fadmin%2Fagent%2Fleads%2Fabc%3Fedit%3D1" });
    expect(resolveAdminRequestGate({ pathname: "/admin/agent" })).toEqual({
      action: "redirect",
      to: "/agent/login?next=%2Fadmin%2Fagent",
    });
  });

  it("keeps non-agent admin routes on /admin/login", () => {
    for (const pathname of ["/admin/leads", "/admin/agents", "/admin/dashboard", "/admin"]) {
      expect(resolveAdminRequestGate({ pathname })).toEqual({ action: "redirect", to: "/admin/login" });
    }
  });

  it("still admits Global Admin and agent sessions to the agent portal", () => {
    expect(
      resolveAdminRequestGate({ pathname: "/admin/agent/leads", adminSessionCookie: "ARUN" }),
    ).toEqual({ action: "next" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/agent/leads",
        agentSessionCookie: "a".repeat(43),
      }),
    ).toEqual({ action: "next" });
  });
});
