"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isAuthorized } from "@/lib/fast-code";
import FastCodeGate from "./FastCodeGate";

interface GatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * GatedLink Component
 * Prevents navigation and shows FastCodeGate if user is not authorized.
 */
export default function GatedLink({ href, children, className }: GatedLinkProps) {
  const [showGate, setShowGate] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthorized(isAuthorized());
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthorized()) {
      e.preventDefault();
      setShowGate(true);
    }
  };

  return (
    <>
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>
      
      {showGate && <FastCodeGate />}
    </>
  );
}
