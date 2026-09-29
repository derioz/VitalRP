import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, ChevronRight, Loader2, LogIn, CheckCircle2, Truck, ExternalLink } from 'lucide-react';
import { VitalLogo } from '../../components/VitalLogo';
import { Button } from '../../components/Button';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AdminControls } from '../../components/AdminControls';
import { StoreModal } from '../../components/StoreModal';
import { ScrollToTop } from '../../components/ScrollToTop';
import { useAuth } from '../../components/AuthProvider';
import { getApiUrl } from '../../lib/api-config';
import { supabase } from '../../lib/supabase/client';

export const MerchOrders: React.FC = () => {
  const { user, login } = useAuth();
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSuccess = searchParams.get('success') === 'true';

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [singleOrderLoading, setSingleOrderLoading] = useState(false);
  const [lookupNumber, setLookupNumber] = useState('');

  // Fetch single order if orderId param is present
  useEffect(() => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }

    const fetchSingleOrder = async () => {
      setSingleOrderLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(getApiUrl(`/api/merch/orders/${encodeURIComponent(orderId)}`), { headers });
        if (res.ok) {
          const data = await res.json();
          setSelectedOrder(data);
          return;
        }

        // Direct Supabase fallback
        let query = supabase.from('merch_orders').select('*, items:merch_order_items(*)');
        if (orderId.startsWith('cs_')) {
          query = query.eq('stripe_checkout_session_id', orderId);
        } else if (orderId.startsWith('VRP-')) {
          query = query.eq('order_number', orderId);
        } else {
          query = query.eq('id', orderId);
        }

        const { data: dbOrder } = await query.maybeSingle();
        if (dbOrder) {
          setSelectedOrder(dbOrder);
        }
      } catch (err) {
        console.warn('Could not fetch single order details:', err);
      } finally {
        setSingleOrderLoading(false);
      }
    };

    fetchSingleOrder();
  }, [orderId]);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(getApiUrl('/api/merch/orders'), { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
            return;
          }
        }

        // Direct Supabase fallback for user's orders
        if (user?.id || user?.discordId) {
          const { data: dbOrders } = await supabase
            .from('merch_orders')
            .select('*, items:merch_order_items(*)')
            .or(`user_id.eq.${user.id},discord_id.eq.${user.discordId}`)
            .order('created_at', { ascending: false });

          if (dbOrders) setOrders(dbOrders);
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
    navigate(`/merch/order/${cleanNum}`);
  };

  const [isStoreOpen, setIsStoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-vital-500 selection:text-white relative">
      <AdminControls />
      <Navbar onOpenStore={() => setIsStoreOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 relative z-10">
        {/* Sub-Header Breadcrumb Bar */}
        <div className="py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 mb-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-tech tracking-wider uppercase text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">
              Vital RP
            </Link>
            <span className="text-gray-600">/</span>
            <Link to="/merch" className="hover:text-vital-400 transition-colors">
              Merch
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-200 font-bold">Track Orders</span>
          </nav>

          <Link
            to="/merch"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-white border border-white/5 hover:border-white/20 transition-all uppercase tracking-wider"
          >
            <ArrowLeft size={13} />
            <span>Storefront</span>
          </Link>
        </div>
        {/* Success Banner when returning from Stripe Checkout */}
        {isSuccess && (
          <div className="mb-8 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-start gap-4">
            <CheckCircle2 size={32} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-display font-black text-white">Payment Confirmed! Thank You For Your Order!</h2>
              <p className="text-emerald-200/80 text-xs font-tech mt-1">
                Your checkout session was verified. Your merchandise order is now being submitted for Printify fulfillment.
                You will receive email and carrier tracking updates as production begins.
              </p>
            </div>
          </div>
        )}

        {/* Selected Order Details View if orderId is set */}
        {orderId && (
          <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-dark-800/60 border border-vital-500/30 backdrop-blur-xl shadow-2xl">
            {singleOrderLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-vital-500" />
                <span className="text-xs font-tech text-gray-400">Loading order details...</span>
              </div>
            ) : selectedOrder ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
                  <div>
                    <span className="text-[10px] font-tech uppercase tracking-widest text-vital-400 font-bold block mb-1">
                      Order Details
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                      #{selectedOrder.order_number || selectedOrder.id.substring(0, 8).toUpperCase()}
                    </h2>
                    <span className="text-xs font-tech text-gray-400">
                      Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-tech font-bold uppercase tracking-wider ${
                      selectedOrder.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-vital-500/20 text-vital-400 border border-vital-500/30'
                    }`}>
                      Payment: {selectedOrder.payment_status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-tech font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                      Fulfillment: {(selectedOrder.fulfillment_status || 'unfulfilled').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Tracking Info if available */}
                {selectedOrder.tracking_number && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Truck size={24} className="text-vital-400 shrink-0" />
                      <div>
                        <div className="text-xs font-tech text-gray-400">
                          Carrier: <span className="text-white font-bold">{selectedOrder.carrier || 'Standard Printify Courier'}</span>
                        </div>
                        <div className="text-xs font-tech text-white font-mono">
                          Tracking #: {selectedOrder.tracking_number}
                        </div>
                      </div>
                    </div>
                    {selectedOrder.tracking_url && (
                      <a
                        href={selectedOrder.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vital-500/20 text-vital-400 hover:bg-vital-500 hover:text-white transition-all text-xs font-tech"
                      >
                        Track Package <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}

                {/* Items in this order */}
                <h4 className="text-xs font-tech uppercase tracking-widest text-gray-400 font-bold mb-3">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-3 mb-6">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-950/40 border border-white/5">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.product_title} className="w-12 h-12 rounded-lg object-cover bg-white/5 border border-white/10" />
                        )}
                        <div>
                          <h5 className="font-display font-bold text-white text-sm">{item.product_title}</h5>
                          <span className="text-xs font-tech text-gray-400">
                            {[item.variant_title, item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : ''].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-white text-sm">
                          ${((item.total_cents || item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                        </div>
                        <div className="text-[11px] font-tech text-gray-400">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm font-tech">
                  <span className="text-gray-400">Order Total</span>
                  <span className="text-xl font-display font-black text-vital-400">
                    ${(selectedOrder.total_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 font-tech text-xs">
                Could not find order #{orderId}. If you just completed checkout, the confirmation is being generated.
              </div>
            )}
          </div>
        )}

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

      <Footer onOpenStore={() => setIsStoreOpen(true)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
      <ScrollToTop />
    </div>
  );
};
