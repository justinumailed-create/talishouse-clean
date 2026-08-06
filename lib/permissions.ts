"use client";

export type Role = "admin" | "manager" | "associate";

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
}

export type Module =
  | "dashboard"
  | "leads"
  | "buildRequests"
  | "mapsites"
  | "associates"
  | "productionQueue"
  | "activityLogs"
  | "settings";

const FULL_ACCESS: Permission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canAssign: true,
};

const READ_WRITE: Permission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: false,
  canAssign: true,
};

const READ_ONLY: Permission = {
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canAssign: false,
};

const NONE: Permission = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canAssign: false,
};

const PERMISSIONS: Record<Role, Partial<Record<Module, Permission>>> = {
  admin: {
    dashboard: FULL_ACCESS,
    leads: FULL_ACCESS,
    buildRequests: FULL_ACCESS,
    mapsites: FULL_ACCESS,
    associates: FULL_ACCESS,
    productionQueue: FULL_ACCESS,
    activityLogs: FULL_ACCESS,
    settings: FULL_ACCESS,
  },
  manager: {
    dashboard: READ_WRITE,
    leads: READ_WRITE,
    buildRequests: READ_WRITE,
    mapsites: READ_WRITE,
    associates: READ_ONLY,
    productionQueue: READ_WRITE,
    activityLogs: READ_ONLY,
    settings: NONE,
  },
  associate: {
    dashboard: READ_ONLY,
    leads: READ_ONLY,
    buildRequests: READ_ONLY,
    mapsites: READ_ONLY,
    associates: NONE,
    productionQueue: READ_ONLY,
    activityLogs: NONE,
    settings: NONE,
  },
};

export function getRole(): Role {
  if (typeof window === "undefined") return "associate";
  const role = localStorage.getItem("crm_role") || localStorage.getItem("role");
  if (role === "admin" || role === "manager") return role;
  return "associate";
}

export function setRole(role: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem("crm_role", role);
}

export function getPermissions(module: Module): Permission {
  const role = getRole();
  return PERMISSIONS[role]?.[module] || NONE;
}

export function getNavItems(): { href: string; label: string; module: Module }[] {
  const role = getRole();

  const allItems = [
    { href: "/crm", label: "Dashboard", module: "dashboard" as Module },
    { href: "/crm/leads", label: "Leads", module: "leads" as Module },
    { href: "/crm/build-requests", label: "Build Requests", module: "buildRequests" as Module },
    { href: "/crm/mapsites", label: "Mapsites™", module: "mapsites" as Module },
    { href: "/crm/associates", label: "Associates", module: "associates" as Module },
    { href: "/crm/production-queue", label: "Production Queue", module: "productionQueue" as Module },
    { href: "/crm/activity-logs", label: "Activity Logs", module: "activityLogs" as Module },
  ];

  return allItems.filter((item) => {
    const perm = PERMISSIONS[role]?.[item.module];
    return perm?.canView;
  });
}
