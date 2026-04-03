"use client";

import { useState, useEffect } from "react";

interface SuccessToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({ message, show, onClose, duration = 3000 }: SuccessToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 left-6 md:left-auto bg-black text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-slide-in">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function useSuccessToast(initialState = false) {
  const [showSuccess, setShowSuccess] = useState(initialState);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const hideSuccess = () => {
    setShowSuccess(false);
  };

  return { showSuccess, successMessage, showSuccessMessage, hideSuccess };
}
