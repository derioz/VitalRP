import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';
import { supabase } from '../../../lib/supabase/client';

type MerchTab = 'overview' | 'orders' | 'products' | 'sync';

export const MerchManagerPage: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<MerchTab>('overview');

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const canManage = isSuperAdmin || isAdmin || hasPermission('merch.manage') || user?.role === 'admin' || user?.role === 'owner';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Try API endpoints first
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/merch/orders?all=true', { headers }).catch(() => null),
        fetch('/api/merch/products', { headers }).catch(() => null),
      ]);

      let loadedOrders = false;
      if (ordersRes && ordersRes.ok) {
        const oData = await ordersRes.json();
        if (Array.isArray(oData.orders)) {
          setOrders(oData.orders);
          loadedOrders = true;
        }
      }

      if (!loadedOrders) {
        // Fallback directly to Supabase client
        const { data: dbOrders } = await supabase
          .from('merch_orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbOrders) setOrders(dbOrders);
      }

      let loadedProducts = false;
      if (productsRes && productsRes.ok) {
        const pData = await productsRes.json();
        if (Array.isArray(pData.products)) {
          setProducts(pData.products);
          loadedProducts = true;
        }
      }

      if (!loadedProducts) {
        // Fallback directly to Supabase client
        const { data: dbProducts } = await supabase
          .from('merch_products')
          .select('*, merch_variants(*)')
          .order('sort_order', { ascending: true });
        if (dbProducts) setProducts(dbProducts);
      }
    } catch (err) {
      console.error('Error fetching admin merch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/merch/sync', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      setSyncFeedback(data.message || 'Catalog synced successfully from Printify!');
      await fetchData();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total_cents : 0), 0);
  const totalOrders = orders.length;
  const inProductionOrders = orders.filter((o) => o.fulfillment_status === 'in_production' || o.fulfillment_status === 'submitted').length;
  const shippedOrders = orders.filter((o) => o.fulfillment_status === 'shipped' || o.fulfillment_status === 'delivered').length;
  const fulfillmentErrors = orders.filter((o) => o.fulfillment_status === 'fulfillment_error').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-tech uppercase tracking-widest text-vital-400 font-bold">
              E-Commerce Management
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Printify API Connected
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight mt-1">
            Merch Command Center
          </h1>
          <p className="text-gray-400 text-sm font-sans mt-0.5">
            Live orders, product pricing controls, Printify POD sync, and sales metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing || !canManage}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider bg-vital-500 hover:bg-vital-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-vital-500/20 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Syncing Catalog...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Sync with Printify</span>
              </>
            )}
          </button>
          <Link
            to="/merch"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-all"
          >
            <span>Live Store</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-xs font-tech border flex items-center justify-between ${
            syncFeedback.startsWith('Error')
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {!syncFeedback.startsWith('Error') && <CheckCircle size={16} />}
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-gray-500 hover:text-white text-xs cursor-pointer ml-4"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'orders', label: `Orders (${orders.length})` },
          { id: 'products', label: `Catalog (${products.length})` },
          { id: 'sync', label: 'Printify Diagnostics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MerchTab)}
            className={`px-4 py-2 rounded-xl text-xs font-tech uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-vital-500 text-white shadow-lg shadow-vital-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-tech uppercase tracking-widest">Gross Revenue</span>
                <DollarSign size={18} className="text-vital-400" />
              </div>
              <div className="text-3xl font-display font-black text-white">
                ${(totalRevenue / 100).toFixed(2)}
              </div>
              <span className="text-[11px] font-tech text-gray-500 mt-1 block">Paid via Stripe Checkout</span>
            </div>

            <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-tech uppercase tracking-widest">Total Orders</span>
                <ShoppingBag size={18} className="text-blue-400" />
              </div>
              <div className="text-3xl font-display font-black text-white">{totalOrders}</div>
              <span className="text-[11px] font-tech text-gray-500 mt-1 block">Lifetime website purchases</span>
            </div>

            <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-tech uppercase tracking-widest">In Production</span>
                <Package size={18} className="text-amber-400" />
              </div>
              <div className="text-3xl font-display font-black text-white">{inProductionOrders}</div>
              <span className="text-[11px] font-tech text-gray-500 mt-1 block">Currently at Printify facility</span>
            </div>

            <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-tech uppercase tracking-widest">Shipped & Delivered</span>
                <Truck size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-display font-black text-white">{shippedOrders}</div>
              <span className="text-[11px] font-tech text-gray-500 mt-1 block">With carrier tracking</span>
            </div>
          </div>

          {/* Fulfillment Alert Banner if any errors exist */}
          {fulfillmentErrors > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-400 shrink-0" size={20} />
                <div>
                  <h4 className="text-sm font-display font-bold text-white">
                    {fulfillmentErrors} Order(s) Encountered Fulfillment Errors
                  </h4>
                  <p className="text-xs font-tech text-gray-400">
                    Payment succeeded on Stripe, but Printify rejected the submission (e.g. invalid shipping address or out-of-stock blank).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-tech font-bold text-xs uppercase cursor-pointer"
              >
                Inspect Orders
              </button>
            </div>
          )}

          {/* Recent Orders Overview */}
          <div className="bg-dark-900 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white text-lg">Recent Orders</h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-tech text-vital-400 hover:underline cursor-pointer"
              >
                View All Orders →
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs font-tech">
                No orders placed yet. Orders placed in Stripe will appear here immediately.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-tech">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500">
                      <th className="pb-3 font-bold uppercase">Order #</th>
                      <th className="pb-3 font-bold uppercase">Customer</th>
                      <th className="pb-3 font-bold uppercase">Payment</th>
                      <th className="pb-3 font-bold uppercase">Fulfillment</th>
                      <th className="pb-3 font-bold uppercase">Printify ID</th>
                      <th className="pb-3 font-bold uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-bold text-white">#{o.order_number}</td>
                        <td className="py-3 text-gray-300">
                          <div>{o.customer_name}</div>
                          <div className="text-[10px] text-gray-500">{o.customer_email}</div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.payment_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              o.fulfillment_status === 'shipped' || o.fulfillment_status === 'delivered'
                                ? 'bg-blue-500/10 text-blue-400'
                                : o.fulfillment_status === 'fulfillment_error'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-vital-500/10 text-vital-400'
                            }`}
                          >
                            {o.fulfillment_status ? o.fulfillment_status.replace('_', ' ') : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 font-mono">{o.printify_status || 'N/A'}</td>
                        <td className="py-3 text-right font-bold text-white">
                          ${(o.total_cents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGER */}
      {activeTab === 'orders' && (
        <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-white text-lg">All Store Orders</h3>
          {orders.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs font-tech">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-tech">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500">
                    <th className="pb-3 uppercase">Order #</th>
                    <th className="pb-3 uppercase">Date</th>
                    <th className="pb-3 uppercase">Customer</th>
                    <th className="pb-3 uppercase">Status</th>
                    <th className="pb-3 uppercase">Tracking</th>
                    <th className="pb-3 uppercase text-right">Total</th>
                    <th className="pb-3 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-bold text-white">#{o.order_number}</td>
                      <td className="py-3 text-gray-400">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-gray-300">
                        <div>{o.customer_name}</div>
                        <div className="text-[10px] text-gray-500">{o.customer_email}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.fulfillment_status === 'shipped' || o.fulfillment_status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : o.fulfillment_status === 'fulfillment_error'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-vital-500/10 text-vital-400'
                          }`}
                        >
                          {o.fulfillment_status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">
                        {o.tracking_number ? (
                          <a
                            href={o.tracking_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-vital-400 hover:underline flex items-center gap-1"
                          >
                            <span>{o.carrier}: {o.tracking_number}</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-gray-600">Pending</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-bold text-white">
                        ${(o.total_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/merch/order/${o.order_number}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-tech text-xs uppercase"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTS & CATALOG */}
      {activeTab === 'products' && (
        <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-white text-lg">
              Synced Catalog ({products.length} Products)
            </h3>
            <span className="text-xs font-tech text-gray-500">
              Source of Truth: Printify Custom Shop #29132686
            </span>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs font-tech">
              No products synced yet. Click &quot;Sync with Printify&quot; above to import your catalog.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => {
                const img = p.mockup_images?.[0]?.src || '/merch/hoodie.png';
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-dark-800/40 border border-white/5 flex gap-3 items-center"
                  >
                    <div className="w-16 h-16 rounded-lg bg-dark-950 border border-white/5 overflow-hidden shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-display font-bold text-sm truncate">{p.title}</h4>
                      <div className="flex items-center justify-between text-xs font-tech mt-1">
                        <span className="text-vital-400 font-bold">${(p.retail_price_cents / 100).toFixed(2)}</span>
                        <span className="text-gray-500 uppercase">{p.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-tech font-bold uppercase ${
                            p.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-[10px] font-tech text-gray-500">
                          {p.merch_variants?.length || p.variants?.length || 0} variants
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRINTIFY DIAGNOSTICS */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-white text-lg">Printify API Diagnostics</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-xs font-tech">
              <div className="p-4 rounded-xl bg-dark-800/40 border border-white/5">
                <span className="text-gray-500 uppercase block mb-1">Target Shop</span>
                <span className="text-white font-bold text-sm">Vital RP Merch</span>
                <span className="text-gray-400 block mt-1">Shop ID: 29132686</span>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/40 border border-white/5">
                <span className="text-gray-500 uppercase block mb-1">Integration Protocol</span>
                <span className="text-emerald-400 font-bold text-sm">Custom API Integration</span>
                <span className="text-gray-400 block mt-1">Bearer Token Authenticated</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h4 className="font-display font-bold text-white text-sm mb-2">Registered Webhooks</h4>
              <p className="text-xs font-tech text-gray-400 mb-4">
                Stripe and Printify events are automatically processed with server-side signature validation and duplicate event deduplication.
              </p>
              <div className="space-y-2 text-xs font-tech">
                <div className="flex justify-between p-2.5 rounded-lg bg-dark-950 border border-white/5">
                  <span className="text-white">Stripe Webhook Endpoint:</span>
                  <span className="text-vital-400 font-mono">/api/webhooks/stripe</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-dark-950 border border-white/5">
                  <span className="text-white">Printify Webhook Endpoint:</span>
                  <span className="text-vital-400 font-mono">/api/webhooks/printify</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
