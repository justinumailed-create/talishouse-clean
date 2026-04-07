'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function FloatingContactButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Link
      href="/"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-black text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
    >
      <Image
        src="/logo-windswept-white.svg"
        alt="Windswept"
        width={100}
        height={28}
        className="h-7 w-auto object-contain brightness-0 invert"
      />
    </Link>
  );
}
