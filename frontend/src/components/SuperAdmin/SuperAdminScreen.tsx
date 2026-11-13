import React, { useState, useEffect } from 'react';
import { Shield, Store, Users, DollarSign, Receipt, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '../../api';

export const SuperAdminScreen: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, shopsRes] = await Promise.all([
        adminApi.dashboard(),
        adminApi.shops(),
      ]);
      setData(dashRes.data);
      setShops(shopsRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await adminApi.toggleShopStatus(id);
      alert(res.data.message);
      loadAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Super Admin platform data...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Super Administrator Portal
          </h1>
          <p className="text-xs text-slate-400">
            Platform-wide management of registered shops, active tenants, and GMV.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Total Shops</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {data?.overview?.total_shops}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Registered Users</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {data?.overview?.total_users}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Total Invoices</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {data?.overview?.total_invoices}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 uppercase font-bold">Platform Sales Volume</p>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
            ₹{Number(data?.overview?.total_gmv).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Registered Shops Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
            Registered Retail Stores & Tenants
          </h3>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
              <th className="py-3 px-4">Shop Name</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Business Type</th>
              <th className="py-3 px-4 text-center">Invoices</th>
              <th className="py-3 px-4 text-center">Products</th>
              <th className="py-3 px-4 text-center">GSTIN</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {shops.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  {s.name}
                  {s.city && <p className="text-[10px] text-slate-400">{s.city}</p>}
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{s.owner?.name}</p>
                  <p className="text-[10px] text-slate-400">{s.owner?.email}</p>
                </td>
                <td className="py-3 px-4 capitalize font-medium">{s.business_type}</td>
                <td className="py-3 px-4 text-center font-mono font-bold">{s.invoices_count}</td>
                <td className="py-3 px-4 text-center font-mono">{s.products_count}</td>
                <td className="py-3 px-4 text-center font-mono">{s.gstin || 'Non-GST'}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      s.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleToggleStatus(s.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {s.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
