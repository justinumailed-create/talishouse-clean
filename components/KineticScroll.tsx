"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const benefits = [
  "LEASE-TO-OWN AVAILABLE",
  "START YOUR SIDE BUSINESS",
  "MODULAR LUXURY HOMES",
  "BUILD IN DAYS, NOT MONTHS",
];

export default function KineticScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startY = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const animFrame = useRef(0);
  const currentTranslate = useRef(0);

  const itemHeight = 80;
  const maxIndex = benefits.length - 1;

  const snapToNearest = useCallback((currentY: number) => {
    const targetIndex = Math.max(0, Math.min(maxIndex, Math.round(-currentY / itemHeight)));
    const targetY = -targetIndex * itemHeight;
    return targetY;
  }, [maxIndex]);

  const animate = useCallback(() => {
    setTranslateY((prev) => {
      let newY = prev + velocity * 16; // ~60fps
      let newVelocity = velocity * 0.95;

      if (Math.abs(newVelocity) < 0.5) {
        newVelocity = 0;
        newY = snapToNearest(newY);
        setVelocity(0);
        cancelAnimationFrame(animFrame.current);
        return newY;
      }

      setVelocity(newVelocity);
      return newY;
    });

    animFrame.current = requestAnimationFrame(animate);
  }, [velocity, snapToNearest]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    cancelAnimationFrame(animFrame.current);
    setIsDragging(true);
    const y = e.touches[0].clientY;
    startY.current = y;
    lastY.current = y;
    lastTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    const delta = y - lastY.current;
    const now = Date.now();
    const timeDelta = now - lastTime.current;

    const newY = translateY + delta;
    setTranslateY(newY);
    currentTranslate.current = newY;

    if (timeDelta > 0) {
      const newVelocity = delta / timeDelta * 16;
      setVelocity(newVelocity);
    }

    lastY.current = y;
    lastTime.current = now;
  }, [isDragging, translateY]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    if (Math.abs(velocity) > 0.5) {
      animFrame.current = requestAnimationFrame(animate);
    } else {
      setTranslateY(prev => snapToNearest(prev));
    }
  }, [velocity, animate, snapToNearest]);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  return (
    <div className="benefits-wrapper">
      <div className="benefits-viewport">
        <div
          ref={trackRef}
          className="benefits-track"
          style={{ transform: `translateY(${translateY}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {benefits.map((text, i) => (
            <div key={i} className="benefit-item">
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
