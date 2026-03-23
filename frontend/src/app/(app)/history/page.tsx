"use client";

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { History as HistoryIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  expiryDate: string;
}

export default function History() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/inventory/history');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to permanently delete this record?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete failed');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 pb-32 max-w-2xl mx-auto page-transition">
      <header className="mb-10 mt-6 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text text-transparent flex justify-center sm:justify-start items-center">
          <HistoryIcon className="w-10 h-10 mr-3 text-red-500" /> History
        </h1>
        <p className="text-foreground/50 mt-2 font-medium">Items that have crossed their expiry date</p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border-dashed border-2 border-foreground/10 opacity-50">
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">No expired items yet. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="glass-card p-4 rounded-2xl shadow-sm flex items-center mb-4 opacity-60 hover:opacity-100 transition-opacity border-white/5 grayscale-[0.5] hover:grayscale-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-background mr-4 border border-white/10" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-foreground/5 mr-4 flex items-center justify-center text-foreground/20 text-2xl font-black border border-white/10">
                  {item.name.charAt(0)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground line-through opacity-50 truncate">{item.name}</h3>
                {item.brand && <p className="text-xs text-foreground/40 truncate font-medium">{item.brand}</p>}
                
                <div className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-tighter">
                  Expired on {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end">
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 text-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                  aria-label="Delete history record"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

  );
}
