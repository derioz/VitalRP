'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle,
  Eye,
  EyeOff,
  Star,
  Tag,
  Plus,
  ArrowUpRight,
  Loader2,
  Calendar,
  Lock,
  Trash2,
  RotateCcw,
  AlertOctagon,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase/client';

type MerchTab = 'overview' | 'products' | 'orders' | 'discounts' | 'sync';

export default function AdminMerchPage() {
  const { user, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<MerchTab>('overview');

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Stuck product management state
  const [productFeedback, setProductFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<any | null>(null);
  const [deleteModalMode, setDeleteModalMode] = useState<'delete' | 'force_delete'>('delete');
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Quick lookup tool state
  const [lookupId, setLookupId] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<any | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const canManage = isSuperAdmin || isAdmin || hasPermission('merch.manage') || user?.role === 'admin' || user?.role === 'owner';

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/merch/orders?all=true', { headers }).catch(() => null),
        fetch('/api/merch/products?admin=true', { headers }).catch(() => null),
      ]);

      if (ordersRes && ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
      } else {
        // Fallback directly to Supabase client query
        const { data: dbOrders } = await supabase
          .from('merch_orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbOrders) setOrders(dbOrders);
      }

      if (productsRes && productsRes.ok) {
        const pData = await productsRes.json();
        setProducts(pData.products || []);
      } else {
        // Fallback directly to Supabase client query
        const { data: dbProducts } = await supabase
          .from('merch_products')
          .select('*, merch_variants(*)')
          .order('display_order', { ascending: true });
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
      setSyncFeedback(data.message || 'Catalog synced successfully!');
      await fetchData();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const cleanId = (val: string) => {
    const match = val.match(/([a-f0-9]{24})/i);
    return match ? match[1] : val.trim();
  };

  const handleInspectProduct = async () => {
    const targetId = cleanId(lookupId);
    if (!targetId) return;
    setIsInspecting(true);
    setInspectError(null);
    setInspectedProduct(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/merch/products/${targetId}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect product on Printify.');
      }
      setInspectedProduct(data);
    } catch (err: any) {
      setInspectError(err.message || 'Error inspecting product.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleResetPublishing = async (productId: string) => {
    setActionLoading(productId);
    setProductFeedback(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/merch/products/${productId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reset_publishing' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset publishing.');
      }

      setProductFeedback({
        type: 'success',
        message: data.message || `Publishing state reset for product ${productId}. The product is now unlocked in Printify.`,
      });
      await fetchData();
      if (inspectedProduct?.productId === productId) {
        await handleInspectProduct();
      }
    } catch (err: any) {
      setProductFeedback({
        type: 'error',
        message: err.message || 'Failed to reset publishing state.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    const targetId = deleteModalProduct.printify_product_id || deleteModalProduct.id;
    setIsDeleting(true);
    setModalError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/merch/products/${targetId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: deleteModalMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product from Printify.');
      }

      setDeleteModalProduct(null);
      setProductFeedback({
        type: 'success',
        message: data.message || `Product ${targetId} was successfully deleted.`,
      });
      if (inspectedProduct?.productId === targetId) {
        setInspectedProduct(null);
      }
      await fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Error deleting product.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total_cents : 0), 0);
  const totalOrders = orders.length;
  const inProductionOrders = orders.filter((o) => o.fulfillment_status === 'in_production' || o.fulfillment_status === 'submitted').length;
  const shippedOrders = orders.filter((o) => o.fulfillment_status === 'shipped' || o.fulfillment_status === 'delivered').length;
  const fulfillmentErrors = orders.filter((o) => o.fulfillment_status === 'fulfillment_error').length;

  return (
    <AdminShell>
      <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerSync}
              disabled={isSyncing || !canManage}
              icon={isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            >
              {isSyncing ? 'Syncing Catalog...' : 'Sync with Printify'}
            </Button>
            <Button href="/merch" target="_blank" variant="secondary" size="sm" icon={<ExternalLink size={14} />}>
              Live Store
            </Button>
          </div>
        </div>

        {syncFeedback && (
          <div
            className={`p-4 rounded-xl text-xs font-tech border ${
              syncFeedback.startsWith('Error')
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {syncFeedback}
          </div>
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
                  No orders placed yet. Test orders placed in Stripe test mode will appear here immediately.
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
                              {o.fulfillment_status.replace('_', ' ')}
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
                          <Button href={`/merch/order/${o.order_number}`} target="_blank" variant="outline" size="sm">
                            Inspect
                          </Button>
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
          <div className="space-y-6">
            {/* Feedback alert */}
            {productFeedback && (
              <div
                className={`p-4 rounded-xl text-xs font-tech border flex items-center justify-between gap-3 ${
                  productFeedback.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <span>{productFeedback.message}</span>
                <button
                  onClick={() => setProductFeedback(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Stuck Products Banner if any found */}
            {products.some((p) => p.is_locked || p.is_stuck_publishing || p.status === 'publishing') && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-display font-bold text-white">
                      Products Detected Stuck in Printify &quot;Publishing&quot; State
                    </h4>
                    <p className="text-xs font-tech text-gray-400 mt-0.5">
                      Printify places products in a locked state while waiting for the custom sales channel to acknowledge completion.
                      Click <strong>Reset Publishing</strong> to clear the lock, or use <strong>Force Delete</strong> to permanently remove them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stuck Product Quick Recovery & Inspection Box */}
            <div className="bg-dark-900 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-vital-400" />
                  <span className="text-xs font-tech uppercase font-bold text-white tracking-wider">
                    Stuck Publishing Recovery &amp; Direct Deletion Tool
                  </span>
                </div>
                <span className="text-[10px] font-tech text-gray-500 hidden sm:inline">
                  Manage any Printify item by ID even if not yet saved to local catalog
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Paste Printify Product ID (e.g. 6abbfe5b33ab8a78df031de4) or Printify URL..."
                  className="flex-1 px-3 py-2 rounded-xl bg-dark-950 border border-white/10 text-white placeholder-gray-500 text-xs font-tech focus:outline-none focus:border-vital-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInspectProduct();
                  }}
                />
                <button
                  type="button"
                  onClick={handleInspectProduct}
                  disabled={isInspecting || !lookupId.trim()}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {isInspecting ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  <span>Inspect Product</span>
                </button>
              </div>

              {inspectError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-tech">
                  {inspectError}
                </div>
              )}

              {/* Inspected Product Quick Action Card */}
              {inspectedProduct && (
                <div className="p-4 rounded-xl bg-dark-950 border border-vital-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-display font-bold text-sm">
                          {inspectedProduct.printifyProduct?.title || 'Unknown Title'}
                        </h4>
                        {inspectedProduct.isLocked ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-tech font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            Stuck Publishing (Locked)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-tech font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-tech text-gray-400 font-mono mt-0.5">
                        ID: {inspectedProduct.productId} • {inspectedProduct.printifyProduct?.variants_count || 0} variants
                        {inspectedProduct.localProduct ? ' • Synced in local store' : ' • Not in local store'}
                      </div>
                    </div>

                    {/* Action buttons for inspected product */}
                    <div className="flex items-center gap-2 shrink-0">
                      {inspectedProduct.isLocked && (
                        <button
                          type="button"
                          onClick={() => handleResetPublishing(inspectedProduct.productId)}
                          disabled={actionLoading === inspectedProduct.productId || !canManage}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-tech font-bold uppercase bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading === inspectedProduct.productId ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RotateCcw size={12} />
                          )}
                          <span>Reset Publishing</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalProduct({
                            id: inspectedProduct.productId,
                            printify_product_id: inspectedProduct.productId,
                            title: inspectedProduct.printifyProduct?.title || inspectedProduct.productId,
                            is_locked: inspectedProduct.isLocked,
                          });
                          setDeleteModalMode('delete');
                        }}
                        disabled={!canManage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-tech font-bold uppercase bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Delete Product</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalProduct({
                            id: inspectedProduct.productId,
                            printify_product_id: inspectedProduct.productId,
                            title: inspectedProduct.printifyProduct?.title || inspectedProduct.productId,
                            is_locked: inspectedProduct.isLocked,
                          });
                          setDeleteModalMode('force_delete');
                        }}
                        disabled={!canManage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-tech font-bold uppercase bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
                      >
                        <AlertOctagon size={12} />
                        <span>Force Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Catalog Grid */}
            <div className="bg-dark-900 border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-bold text-white text-lg">
                  Synced Catalog ({products.length} Products)
                </h3>
                <span className="text-xs font-tech text-gray-500">
                  Source of Truth: Printify Custom Shop #29132686
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                  const img = p.mockup_images?.[0]?.src || '/merch/hoodie.png';
                  const isLocked = Boolean(p.is_locked || p.is_stuck_publishing || p.status === 'publishing');
                  const targetId = p.printify_product_id || p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isLocked
                          ? 'bg-amber-500/[0.04] border-amber-500/30 shadow-lg shadow-amber-500/5'
                          : 'bg-dark-800/40 border-white/5'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-16 h-16 rounded-lg bg-dark-950 border border-white/5 overflow-hidden shrink-0">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-display font-bold text-sm truncate">{p.title}</h4>
                          <div className="flex items-center justify-between text-xs font-tech mt-1">
                            <span className="text-vital-400 font-bold">${(p.retail_price_cents / 100).toFixed(2)}</span>
                            <span className="text-gray-500 uppercase">{p.category}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {isLocked ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-tech font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                                <AlertTriangle size={9} />
                                <span>Stuck Publishing</span>
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-tech font-bold uppercase ${
                                  p.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {p.status}
                              </span>
                            )}
                            <span className="text-[10px] font-tech text-gray-500">
                              {p.variants?.length || 0} variants
                            </span>
                          </div>
                          <div className="text-[10px] font-tech text-gray-500 font-mono mt-1 truncate">
                            ID: {targetId}
                          </div>
                        </div>
                      </div>

                      {/* Product Card Actions */}
                      <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-end gap-1.5">
                        {isLocked && (
                          <button
                            type="button"
                            onClick={() => handleResetPublishing(targetId)}
                            disabled={actionLoading === targetId || !canManage}
                            title="Reset Printify stuck publishing lock"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-tech font-bold uppercase bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {actionLoading === targetId ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <RotateCcw size={11} />
                            )}
                            <span>Reset Publishing</span>
                          </button>
                        )}

                        {isLocked && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalProduct(p);
                              setDeleteModalMode('force_delete');
                            }}
                            disabled={!canManage}
                            title="Reset stuck lock and permanently delete"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-tech font-bold uppercase bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <AlertOctagon size={11} />
                            <span>Force Delete</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteModalProduct(p);
                            setDeleteModalMode('delete');
                          }}
                          disabled={!canManage}
                          title="Permanently delete product"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-tech font-bold uppercase bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PERMANENT DELETION CONFIRMATION MODAL */}
        {deleteModalProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="bg-dark-900 border border-red-500/30 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertOctagon size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 id="delete-dialog-title" className="text-lg font-display font-black text-white tracking-tight">
                    {deleteModalMode === 'force_delete' ? 'Confirm Force Delete' : 'Confirm Permanent Deletion'}
                  </h3>
                  <p className="text-xs font-tech text-gray-400 mt-1">
                    {deleteModalMode === 'force_delete'
                      ? "This will first reset Printify's stuck publishing state, permanently delete the product from Printify via the API, and remove it from the local catalog."
                      : 'This will permanently delete the product directly from Printify Custom Shop #29132686 and clean up the local store record.'}
                  </p>
                </div>
              </div>

              {/* Product Details Box */}
              <div className="p-3.5 rounded-xl bg-dark-950 border border-white/5 space-y-1.5 text-xs font-tech">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Product Title:</span>
                  <span className="text-white font-bold truncate max-w-[280px]">{deleteModalProduct.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Printify Product ID:</span>
                  <span className="text-vital-400 font-mono">
                    {deleteModalProduct.printify_product_id || deleteModalProduct.id}
                  </span>
                </div>
                {deleteModalProduct.is_locked && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Current State:</span>
                    <span className="text-amber-400 font-bold">Stuck in Publishing (Locked)</span>
                  </div>
                )}
              </div>

              {/* Irreversible Warning */}
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-tech flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
                <span>
                  <strong>Warning:</strong> This action is <strong>irreversible</strong>. The product blueprint will be deleted from Printify. Completed Stripe orders and customer receipts are safely preserved.
                </span>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-tech">
                  {modalError}
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalProduct(null);
                    setModalError(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-tech uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting from Printify...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>
                        {deleteModalMode === 'force_delete' ? 'Yes, Force Delete' : 'Yes, Delete Permanently'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
    </AdminShell>
  );
}
