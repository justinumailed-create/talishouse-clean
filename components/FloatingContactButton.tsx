'use client';

import { useState, useEffect } from 'react';
import { UI } from "@/styles/design-system";

export default function FloatingContactButton() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className={UI.button}
    >
      Contact Us
    </button>
  );
}
