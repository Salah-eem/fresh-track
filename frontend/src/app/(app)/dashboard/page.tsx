"use client";

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { Trash2, AlertTriangle, CheckCircle, Clock, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '../../../components/ThemeToggle';
import ReceiptScanner from '../../../components/inventory/ReceiptScanner';

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
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        icon: <AlertTriangle className="w-4 h-4 mr-1.5" />,
        text: 'Expired',
        border: 'border-red-500/20'
      };
    }
    if (days <= 3) {
      return {
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        icon: <Clock className="w-4 h-4 mr-1.5" />,
        text: `Exp. in ${days} day${days !== 1 ? 's' : ''}`,
        border: 'border-orange-500/20'
      };
    }
    return {
      color: 'text-primary',
      bg: 'bg-primary/10',
      icon: <CheckCircle className="w-4 h-4 mr-1.5" />,
      text: `Exp. in ${days} days`,
      border: 'border-primary/20'
    };

  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 pb-32 max-w-2xl mx-auto page-transition">
      <header className="mb-10 mt-6 flex items-start justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">My Fridge</h1>
          <p className="text-foreground/50 mt-2 font-medium">Keep track of your items before they expire</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mb-8">
        <ReceiptScanner />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border-dashed border-2 border-primary/20">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground/60 mb-6 font-medium">Your fridge is empty!</p>
          <Link
            href="/add"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Add your first item
          </Link>
        </div>

      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const status = getStatusDisplay(item.expiryDate);
            return (
              <Link href={`/item/${item.id}`} key={item.id} className="block group">
                <div className="glass-card p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex items-center mb-4 cursor-pointer border-white/10 group-hover:border-primary/30 group-hover:translate-x-1">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-background mr-4 border border-white/10 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-primary/10 mr-4 flex items-center justify-center text-primary text-2xl font-bold border border-white/10">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">{item.name}</h3>
                    {item.brand && <p className="text-sm text-foreground/50 truncate font-medium">{item.brand}</p>}
                    
                    <div className={`inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color} border ${status.border}`}>
                      {status.icon}
                      {status.text}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end justify-between h-20">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 text-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">
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
