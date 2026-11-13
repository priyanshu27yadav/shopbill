import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Phone,
  MapPin,
  Clock,
  ArrowUpRight,
  X,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { customerApi } from '../../api';
import { Customer } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CustomerList: React.FC = () => {
  const { shop } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUdhaarOnly, setFilterUdhaarOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [collectPaymentCustomer, setCollectPaymentCustomer] = useState<Customer | null>(null);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);

  // Collect Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payRef, setPayRef] = useState('');

  // Add Customer Form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    credit_limit: '5000',
    opening_balance: '0',
  });

  useEffect(() => {
    loadCustomers();
  }, [shop]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.list({ per_page: 100 });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;

    try {
      const res = await customerApi.create({
        ...newCustomer,
        credit_limit: parseFloat(newCustomer.credit_limit) || 0,
        opening_balance: parseFloat(newCustomer.opening_balance) || 0,
      });
      setCustomers([res.data.customer, ...customers]);
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        credit_limit: '5000',
        opening_balance: '0',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating customer.');
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectPaymentCustomer || !payAmount || parseFloat(payAmount) <= 0) return;

    try {
      const res = await customerApi.collectPayment(collectPaymentCustomer.id, {
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        reference_number: payRef || null,
      });
      alert(res.data.message);
      setCollectPaymentCustomer(null);
      setPayAmount('');
      setPayRef('');
      loadCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const handleOpenHistory = async (c: Customer) => {
    setViewHistoryCustomer(c);
    try {
      const res = await customerApi.get(c.id);
      setCustomerInvoices(res.data.invoices || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = customers.filter((c) => {
    const matchSearch =
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchUdhaar = !filterUdhaarOnly || Number(c.current_balance) > 0;
    return matchSearch && matchUdhaar;
  });

  const totalUdhaar = customers.reduce((sum, c) => sum + Math.max(0, Number(c.current_balance)), 0);
  const currency = shop?.currency_symbol || '₹';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Customer & Udhaar Ledger (Khata)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer profiles, purchase history, and collect pending credit balances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Customers</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {customers.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm bg-rose-50/20 dark:bg-rose-950/20">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase">
            Total Udhaar (Outstanding)
          </p>
          <p className="text-2xl font-black text-rose-600 font-mono mt-1">
            {currency}{totalUdhaar.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase">Debtor Accounts</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {customers.filter((c) => Number(c.current_balance) > 0).length}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <input
            type="checkbox"
            checked={filterUdhaarOnly}
            onChange={(e) => setFilterUdhaarOnly(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span>Show Pending Udhaar Only</span>
        </label>
      </div>

      {/* Customers List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Credit Balance (Udhaar)</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => {
                const bal = Number(c.current_balance);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                      {c.address && <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {c.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {currency}{Number(c.total_purchases).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {bal > 0 ? (
                        <span className="font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          {currency}{bal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {currency}{Number(c.credit_limit).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {bal > 0 && (
                        <button
                          onClick={() => {
                            setCollectPaymentCustomer(c);
                            setPayAmount(bal.toString());
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        >
                          Collect Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenHistory(c)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {collectPaymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Collect Udhaar Payment
                </h3>
                <p className="text-xs text-slate-400">{collectPaymentCustomer.name}</p>
              </div>
              <button onClick={() => setCollectPaymentCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs">
                <span className="text-rose-700 dark:text-rose-300 font-bold">
                  Outstanding Balance:{' '}
                </span>
                <span className="font-extrabold font-mono text-rose-700 dark:text-rose-300">
                  {currency}{collectPaymentCustomer.current_balance}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white uppercase font-bold"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / QR</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference No. / UTR / Cheque (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref 439281928"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCollectPaymentCustomer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {viewHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Purchase Ledger: {viewHistoryCustomer.name}
                </h3>
                <p className="text-xs text-slate-400">Phone: {viewHistoryCustomer.phone || 'N/A'}</p>
              </div>
              <button onClick={() => setViewHistoryCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {customerInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No purchase history found.</p>
              ) : (
                customerInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{inv.invoice_number}</p>
                      <p className="text-[10px] text-slate-400">{new Date(inv.invoice_date).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{currency}{inv.final_amount}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">New Customer Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustomer.gstin}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                    placeholder="29XXXXX..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Street, Area, City"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ({currency})
                  </label>
                  <input
                    type="number"
                    value={newCustomer.credit_limit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Udhaar ({currency})
                  </label>
                  <input
                    type="number"
                    value={newCustomer.opening_balance}
                    onChange={(e) => setNewCustomer({ ...newCustomer, opening_balance: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
