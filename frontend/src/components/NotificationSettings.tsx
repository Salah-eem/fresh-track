"use client";

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export default function NotificationSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setLoading(false);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
    setLoading(false);
  };

  const subscribeUser = async () => {
    setLoading(true);
    setError('');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from env or handle it
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID Public Key not found');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send to backend
      const subJson = subscription.toJSON();
      await api.post('/notifications/subscribe', {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth
        }
      });

      setIsSubscribed(true);
    } catch (err: any) {
      console.error('Failed to subscribe:', err);
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Optionally notify backend to remove subscription
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications Push</h3>
          <p className="text-sm text-gray-500">Recevez des alertes avant l'expiration de vos produits.</p>
        </div>
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        ) : isSubscribed ? (
          <button 
            onClick={unsubscribeUser}
            className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition"
          >
            <Bell className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button 
            onClick={subscribeUser}
            className="p-3 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition"
          >
            <BellOff className="w-6 h-6" />
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
