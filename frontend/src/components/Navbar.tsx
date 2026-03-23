"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { PackageSearch, History, LogOut, Plus, ChefHat } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 px-6 glass-nav rounded-2xl flex justify-around items-center shadow-2xl z-50 border border-white/20">
      <Link href="/dashboard" className="flex flex-col items-center justify-center w-16 h-full text-foreground/60 hover:text-primary transition-all hover:scale-110 active:scale-95">
        <PackageSearch className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold tracking-wide uppercase">Inventory</span>
      </Link>
      
      <Link href="/add" className="relative group -mt-12">
        <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground rounded-2xl shadow-[0_8px_16px_-4px_rgba(16,185,129,0.4)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-active:scale-95">
          <Plus className="w-8 h-8" />
        </div>
      </Link>

      <Link href="/recipes" className="flex flex-col items-center justify-center w-16 h-full text-foreground/60 hover:text-primary transition-all hover:scale-110 active:scale-95">
        <ChefHat className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold tracking-wide uppercase">Recipes</span>
      </Link>


      <Link href="/history" className="flex flex-col items-center justify-center w-16 h-full text-foreground/60 hover:text-primary transition-all hover:scale-110 active:scale-95">
        <History className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold tracking-wide uppercase">History</span>
      </Link>
      
      <button onClick={logout} className="flex flex-col items-center justify-center w-16 h-full text-foreground/40 hover:text-red-500 transition-all hover:scale-110 active:scale-95">
        <LogOut className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold tracking-wide uppercase">Logout</span>
      </button>
    </nav>
  );
}
