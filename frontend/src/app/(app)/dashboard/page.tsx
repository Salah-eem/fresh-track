"use client";

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  expiryDate: string;
  isExpired: boolean;
}

export default function Dashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchInventory();
    }
  }, [isAuthenticated]);

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete failed');
    }
  };

  const getStatusDisplay = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    
    if (days < 0) {
      return {
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: <AlertTriangle className="w-4 h-4 mr-1" />,
        text: 'Expired',
      };
    }
    if (days <= 3) {
      return {
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        icon: <Clock className="w-4 h-4 mr-1" />,
        text: `Exp. in ${days} day${days !== 1 ? 's' : ''}`,
      };
    }
    return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      icon: <CheckCircle className="w-4 h-4 mr-1" />,
      text: `Exp. in ${days} days`,
    };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24 max-w-2xl mx-auto">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Fridge</h1>
        <p className="text-gray-500 mt-1">Track your items before they expire</p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">Your fridge is empty!</p>
          <Link
            href="/add"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700"
          >
            Add your first item
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const status = getStatusDisplay(item.expiryDate);
            return (
              <Link href={`/item/${item.id}`} key={item.id}>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center mb-4 cursor-pointer">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 mr-4 border border-gray-50" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 mr-4 flex items-center justify-center text-gray-400 font-bold border border-gray-50">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.brand && <p className="text-sm text-gray-500 truncate">{item.brand}</p>}
                    
                    <div className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      {status.icon}
                      {status.text}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-gray-400 mt-2">
                      {format(new Date(item.expiryDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
