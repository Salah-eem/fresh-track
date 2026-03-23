"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-5" />; // Placeholder with same size

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-2xl glass-card text-foreground/60 hover:text-primary transition-all duration-300 shadow-xl border-primary/10 active:scale-90"
      aria-label="Toggle Theme"
    >

      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
