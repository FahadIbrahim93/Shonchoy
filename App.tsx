import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Users,
  X,
} from 'lucide-react';
import type {
  ActiveView,
  Customer,
  ForecastPoint,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  Locale,
  Payment,
  PaymentMethod,
  ShonchoySummary,
} from './types';
import { TRANSLATIONS } from './i18n';
import { api } from './services/api';
import { OverviewView } from './components/OverviewView';
import { InvoicesView } from './components/InvoicesView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { PaymentsView } from './components/PaymentsView';
import { AnalyticsView } from './components/AnalyticsView';
import {
  CreateInvoiceModal,
  CustomerFormModal,
  InvoiceDetailModal,
  ItemFormModal,
  RecordPaymentModal,
} from './components/Modals';

const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('shonchoy_locale');
    return saved === 'bn' ? 'bn' : 'en';
  });
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState('');

  // Modal states
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | undefined>(undefined);

  const t = TRANSLATIONS[locale];

  const loadAll = useCallback(async () => {
    try {
      setBannerError('');
      const [itemsRes, customersRes, invoicesRes, paymentsRes, forecastRes] = await Promise.all([
        api.getItems(),
        api.getCustomers(),
        api.getInvoices(),
        api.getPayments(),
        api.getForecast(),
      ]);
      setItems(itemsRes.data);
      setCustomers(customersRes.data);
      setInvoices(invoicesRes.data);
      setPayments(paymentsRes.data);
      setForecast(forecastRes.data);
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : 'Unable to load Shonchoy store data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleToggleLocale = (next: Locale) => {
    setLocale(next);
    localStorage.setItem('shonchoy_locale', next);
  };

  const summary: ShonchoySummary = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.paid);
    const unpaidInvoices = invoices.filter((i) => !i.paid);
    const lowStock = items.filter((it) => it.quantity <= it.lowStockThreshold);

    return {
      totalRevenue: paidInvoices.reduce((s, i) => s + i.total, 0),
      unpaidAmount: unpaidInvoices.reduce((s, i) => s + i.total, 0),
      unpaidCount: unpaidInvoices.length,
      inventoryValue: items.reduce((s, it) => s + it.quantity * it.price, 0),
      totalItems: items.length,
      lowStockCount: lowStock.length,
      paidInvoicesCount: paidInvoices.length,
      totalInvoicesCount: invoices.length,
    };
  }, [invoices, items]);

  const handleCreateInvoice = async (payload: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    items: InvoiceLineItem[];
    vatRate: number;
    paid: boolean;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
  }) => {
    await api.createInvoice(payload);
    await loadAll();
  };

  const handleSaveCustomer = async (payload: {
    name: string;
    phone: string;
    currentAddress: string;
    addressNote?: string;
  }) => {
    if (editingCustomer) {
      await api.updateCustomer(editingCustomer.id, payload);
    } else {
      await api.createCustomer(payload);
    }
    setEditingCustomer(null);
    await loadAll();
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      await loadAll();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to delete customer.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      await loadAll();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to delete invoice.');
    }
  };

  const handleSaveItem = async (payload: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    price: number;
    lowStockThreshold: number;
  }) => {
    if (editingItem) {
      await api.updateItem(editingItem.id, payload);
    } else {
      await api.createItem(payload);
    }
    setEditingItem(null);
    await loadAll();
  };

  const handleAdjustQuantity = async (item: InventoryItem, delta: number) => {
    const nextQty = Math.max(0, item.quantity + delta);
    try {
      await api.updateItem(item.id, { quantity: nextQty });
      await loadAll();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to update stock.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.deleteItem(id);
      await loadAll();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Failed to delete item.');
    }
  };

  const handleRecordPayment = async (payload: {
    invoiceId: string;
    method: PaymentMethod;
    transactionId: string;
    amount: number;
  }) => {
    await api.recordPayment(payload);
    setSelectedInvoice(null);
    await loadAll();
  };

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t.overview, icon: <LayoutDashboard size={16} /> },
    { id: 'invoices', label: t.invoices, icon: <FileText size={16} /> },
    { id: 'customers', label: t.customers, icon: <Users size={16} /> },
    { id: 'inventory', label: t.inventory, icon: <Package size={16} /> },
    { id: 'payments', label: t.payments, icon: <CreditCard size={16} /> },
    { id: 'analytics', label: t.analytics, icon: <BarChart3 size={16} /> },
  ];

  const activeTitle = navItems.find((n) => n.id === activeView)?.label || t.overview;

  const primaryAction = () => {
    if (activeView === 'customers') {
      return (
        <button
          type="button"
          onClick={() => {
            setEditingCustomer(null);
            setShowCustomerModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> {t.addCustomer}
        </button>
      );
    }
    if (activeView === 'inventory') {
      return (
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setShowItemModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> {t.addItem}
        </button>
      );
    }
    if (activeView === 'payments') {
      return (
        <button
          type="button"
          onClick={() => {
            setPaymentInvoiceId(undefined);
            setShowPaymentModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> {t.recordPayment}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setShowCreateInvoice(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
      >
        <Plus size={14} /> {t.newInvoice}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('overview');
              setMobileNavOpen(false);
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            {t.brand}
          </a>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t.close}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 px-1">
              <Globe size={13} />
              <span>{t.language}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => handleToggleLocale('en')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  locale === 'en'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleToggleLocale('bn')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  locale === 'bn'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="px-1 text-xs text-slate-400">
            <p className="font-medium text-slate-200">{t.storeOwner}</p>
            <p className="text-slate-500 truncate">Dhaka Retail Operations</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar Contract: Brand/Breadcrumb — Concise Nav — 1 Primary Action */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-base font-semibold text-slate-900 whitespace-nowrap truncate">
              {t.brand} <span className="text-slate-400 font-normal">/</span> {activeTitle}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === item.id
                    ? 'text-slate-900 underline underline-offset-8 decoration-emerald-600 decoration-2'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center shrink-0">{primaryAction()}</div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {bannerError && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between gap-4">
              <span>{bannerError}</span>
              <button
                type="button"
                onClick={() => setBannerError('')}
                className="text-xs font-medium underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-28 bg-white border border-slate-200 rounded-xl p-5"
                  />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl" />
            </div>
          ) : (
            <>
              {activeView === 'overview' && (
                <OverviewView
                  locale={locale}
                  summary={summary}
                  invoices={invoices}
                  items={items}
                  forecast={forecast}
                  onNavigate={setActiveView}
                  onSelectInvoice={setSelectedInvoice}
                  onQuickRestock={(it) => handleAdjustQuantity(it, 10)}
                />
              )}

              {activeView === 'invoices' && (
                <InvoicesView
                  locale={locale}
                  invoices={invoices}
                  payments={payments}
                  onOpenCreate={() => setShowCreateInvoice(true)}
                  onSelectInvoice={setSelectedInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                />
              )}

              {activeView === 'customers' && (
                <CustomersView
                  locale={locale}
                  customers={customers}
                  invoices={invoices}
                  onOpenAdd={() => {
                    setEditingCustomer(null);
                    setShowCustomerModal(true);
                  }}
                  onEditCustomer={(c) => {
                    setEditingCustomer(c);
                    setShowCustomerModal(true);
                  }}
                  onDeleteCustomer={handleDeleteCustomer}
                  onSelectInvoice={setSelectedInvoice}
                />
              )}

              {activeView === 'inventory' && (
                <InventoryView
                  locale={locale}
                  items={items}
                  onOpenAdd={() => {
                    setEditingItem(null);
                    setShowItemModal(true);
                  }}
                  onEditItem={(it) => {
                    setEditingItem(it);
                    setShowItemModal(true);
                  }}
                  onAdjustQuantity={handleAdjustQuantity}
                  onDeleteItem={handleDeleteItem}
                />
              )}

              {activeView === 'payments' && (
                <PaymentsView
                  locale={locale}
                  payments={payments}
                  onOpenRecordPayment={() => {
                    setPaymentInvoiceId(undefined);
                    setShowPaymentModal(true);
                  }}
                />
              )}

              {activeView === 'analytics' && (
                <AnalyticsView locale={locale} forecast={forecast} items={items} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          locale={locale}
          items={items}
          customers={customers}
          onClose={() => setShowCreateInvoice(false)}
          onSubmit={handleCreateInvoice}
        />
      )}

      {showCustomerModal && (
        <CustomerFormModal
          locale={locale}
          editingCustomer={editingCustomer}
          onClose={() => {
            setShowCustomerModal(false);
            setEditingCustomer(null);
          }}
          onSubmit={handleSaveCustomer}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          locale={locale}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={(inv) => {
            setSelectedInvoice(null);
            setPaymentInvoiceId(inv.id);
            setShowPaymentModal(true);
          }}
        />
      )}

      {showItemModal && (
        <ItemFormModal
          locale={locale}
          editingItem={editingItem}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSubmit={handleSaveItem}
        />
      )}

      {showPaymentModal && (
        <RecordPaymentModal
          locale={locale}
          unpaidInvoices={invoices.filter((inv) => !inv.paid)}
          initialInvoiceId={paymentInvoiceId}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentInvoiceId(undefined);
          }}
          onSubmit={handleRecordPayment}
        />
      )}
    </div>
  );
};

export default App;
