"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Leaf } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If authenticated, redirect to dashboard.
    // If not authenticated, redirect to login page.
    if (isAuthenticated) {
        router.push('/dashboard');
    } else {
        router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Loading splash screen while determining auth state
  return (
    <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center text-white">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <Leaf className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">FreshTrack</h1>
        <p className="mt-3 text-green-100 font-medium">Loading your fridge...</p>
      </div>
    </div>
  );
}
