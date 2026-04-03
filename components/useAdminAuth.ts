"use client";

import { useState } from "react";

export function useAdminAuth() {
  const [role] = useState<string | null>(null);

  return { role };
}
