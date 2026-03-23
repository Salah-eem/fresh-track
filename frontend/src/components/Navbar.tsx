"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { PackageSearch, History, LogOut, Plus } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-4 pb-safe shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)] z-50">
      <Link href="/dashboard" className="flex flex-col items-center justify-center w-16 h-full text-gray-500 hover:text-green-600 transition-colors">
        <PackageSearch className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Inventory</span>
      </Link>
      
      <Link href="/add" className="relative group">
        <div className="absolute inset-0 bg-green-200 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center w-12 h-12 -mt-8 bg-gradient-to-tr from-green-500 to-emerald-400 text-white rounded-full shadow-lg transform transition-transform group-hover:scale-110 group-active:scale-95">
          <Plus className="w-6 h-6" />
        </div>
      </Link>

      <Link href="/history" className="flex flex-col items-center justify-center w-16 h-full text-gray-500 hover:text-green-600 transition-colors">
        <History className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">History</span>
      </Link>
      
      <button onClick={logout} className="flex flex-col items-center justify-center w-16 h-full text-gray-500 hover:text-red-500 transition-colors">
        <LogOut className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </nav>
  );
}
