import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Package, ChevronRight, Loader2, LogIn } from 'lucide-react';
import { VitalLogo } from '../../components/VitalLogo';
import { Button } from '../../components/Button';
import { useAuth } from '../../components/AuthProvider';

export const MerchOrders: React.FC = () => {
  const { user, login } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const res = await fetch('/api/merch/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.warn('Could not fetch user orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [user]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNumber.trim()) return;
    const cleanNum = lookupNumber.trim().toUpperCase();
    window.location.href = `/merch/order/${cleanNum}`;
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-vital-500 selection:text-white">
      <nav className="border-b border-white/10 bg-dark-950/80 backdrop-blur-md py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to="/merch"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-tech uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </Link>
          <div className="flex items-center gap-2">
            <VitalLogo className="w-7 h-7" />
            <span className="font-display font-bold text-sm tracking-wider">VITAL MERCH</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="mb-8">
          <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold block mb-1">
            Customer Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
            Order Tracking & History
          </h1>
          <p className="text-gray-400 text-sm font-sans mt-1">
            Review past purchases, monitor production status, and retrieve live shipping carrier updates.
          </p>
        </div>

        <div className="bg-dark-800/40 border border-white/10 rounded-2xl p-6 mb-10 backdrop-blur-sm">
          <h3 className="font-display font-bold text-white text-base mb-2">Track Any Order</h3>
          <p className="text-gray-400 text-xs font-tech mb-4">
            Enter your order number from your confirmation email (e.g., VRP-1001) to look up tracking details:
          </p>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Order # (e.g. VRP-1001)"
                value={lookupNumber}
                onChange={(e) => setLookupNumber(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 font-tech uppercase focus:outline-none focus:border-vital-500/50"
              />
            </div>
            <Button variant="primary" size="md" type="submit">
              Track Order
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-white mb-4">
            Your Orders {user ? `(${user.displayName || user.username})` : ''}
          </h2>

          {!user ? (
            <div className="bg-dark-800/20 border border-white/5 rounded-2xl p-8 text-center">
              <LogIn size={32} className="mx-auto text-gray-600 mb-3" />
              <h4 className="text-white font-display font-bold text-base mb-1">
                Want to link your orders to your Discord profile?
              </h4>
              <p className="text-gray-400 text-xs font-tech max-w-md mx-auto mb-6">
                Sign in with Discord to automatically view all merchandise orders associated with your Vital RP account.
              </p>
              <Button onClick={() => login()} variant="secondary" size="sm">
                Sign In with Discord
              </Button>
            </div>
          ) : loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={28} className="animate-spin text-vital-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-dark-800/20 border border-white/5 rounded-2xl p-8 text-center">
              <Package size={32} className="mx-auto text-gray-600 mb-3" />
              <h4 className="text-white font-display font-bold text-base mb-1">
                No orders found for this account
              </h4>
              <Button href="/merch" variant="primary" size="sm">
                Browse Store
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <Link
                  key={ord.id}
                  to={`/merch/order/${ord.order_number}`}
                  className="block p-5 rounded-2xl bg-dark-800/40 border border-white/5 hover:border-vital-500/30 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-white text-lg group-hover:text-vital-400 transition-colors">
                        #{ord.order_number}
                      </span>
                      <span className="text-xs font-tech text-gray-500">
                        {new Date(ord.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-vital-500/10 text-vital-400 border border-vital-500/20">
                        {ord.fulfillment_status.replace('_', ' ')}
                      </span>
                      <span className="font-display font-bold text-white text-sm">
                        ${(ord.total_cents / 100).toFixed(2)}
                      </span>
                      <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
