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
    <div className="min-h-screen p-4 sm:p-6 pb-24 max-w-2xl mx-auto">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <HistoryIcon className="w-8 h-8mr-3 text-red-500 mr-2" /> History
        </h1>
        <p className="text-gray-500 mt-1">Products that have expired</p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">No expired items yet. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center mb-4 opacity-75">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 mr-4 border border-gray-50 grayscale" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 mr-4 flex items-center justify-center text-gray-400 font-bold border border-gray-50">
                  {item.name.charAt(0)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 line-through truncate">{item.name}</h3>
                {item.brand && <p className="text-sm text-gray-500 truncate">{item.brand}</p>}
                
                <div className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Expired on {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end">
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
