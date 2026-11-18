import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Invoice, Locale, Payment } from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';

interface InvoicesViewProps {
  locale: Locale;
  invoices: Invoice[];
  payments: Payment[];
  onOpenCreate: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  locale,
  invoices,
  payments,
  onOpenCreate,
  onSelectInvoice,
  onDeleteInvoice,
}) => {
  const t = TRANSLATIONS[locale];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const txnIdsByInvoice = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of payments) {
      const existing = map.get(p.invoiceId);
      if (existing) {
        existing.push(p.transactionId);
      } else {
        map.set(p.invoiceId, [p.transactionId]);
      }
    }
    return map;
  }, [payments]);

  const filtered = invoices.filter((inv) => {
    if (filter === 'paid' && !inv.paid) return false;
    if (filter === 'unpaid' && inv.paid) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const txnIds = txnIdsByInvoice.get(inv.id) || [];
    return (
      inv.customerName.toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerPhone?.toLowerCase().includes(q) ?? false) ||
      txnIds.some((id) => id.toLowerCase().includes(q))
    );
  });

  const escapeCsvCell = (value: string | number | undefined | null): string => {
    const str = value == null ? '' : String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCsv = () => {
    if (filtered.length === 0) return;

    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Item Count',
      'Line Items',
      'Subtotal (BDT)',
      'VAT Rate (%)',
      'VAT (BDT)',
      'Total (BDT)',
      'Status',
      'Payment Method',
      'Transaction ID',
    ];

    const rows = filtered.map((inv) => {
      const itemCount = inv.items.reduce((sum, l) => sum + l.quantity, 0);
      const lineItemsSummary = inv.items
        .map((l) => `${l.name} (${l.sku}) x${l.quantity}`)
        .join('; ');
      const paymentMethodLabel = inv.paymentMethod
        ? inv.paymentMethod === 'bkash'
          ? 'bKash'
          : inv.paymentMethod === 'nagad'
          ? 'Nagad'
          : 'Cash'
        : 'N/A';
      const txnSummary = (txnIdsByInvoice.get(inv.id) || []).join('; ');

      return [
        inv.invoiceNumber,
        new Date(inv.createdAt).toISOString().slice(0, 10),
        inv.customerName,
        inv.customerPhone ?? '',
        itemCount,
        lineItemsSummary,
        inv.subtotal.toFixed(2),
        inv.vatRate,
        inv.vat.toFixed(2),
        inv.total.toFixed(2),
        inv.paid ? 'Paid' : 'Unpaid',
        paymentMethodLabel,
        txnSummary,
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const suffix = filter === 'all' ? '' : `-${filter}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = `shonchoy-invoices${suffix}-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px] max-w-lg">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchInvoices}
            aria-label={t.searchInvoices}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t.clearSearch}
              title={t.clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'paid', 'unpaid'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t[tab]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 transition-colors"
          >
            <Download size={14} /> {t.downloadCsv}
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <Plus size={14} /> {t.newInvoice}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-500">{t.noInvoices}</p>
            <div className="flex items-center justify-center gap-3">
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  {t.clearSearch}
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCreate}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                {t.createFirstInvoice}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">{t.invoiceNo}</th>
                  <th className="py-3 px-4 font-medium">{t.customer}</th>
                  <th className="py-3 px-4 font-medium">{t.date}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.items}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.vat}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.total}</th>
                  <th className="py-3 px-4 font-medium">{t.status}</th>
                  <th className="py-3 px-5 font-medium text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const txnIds = txnIdsByInvoice.get(inv.id) || [];
                  return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      <p>{inv.invoiceNumber}</p>
                      {txnIds.length > 0 && (
                        <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                          {txnIds.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{inv.customerName}</p>
                      {inv.customerPhone && (
                        <p className="text-xs text-slate-500 font-mono">
                          {inv.customerPhone}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {inv.items.reduce((s, l) => s + l.quantity, 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {formatBDT(inv.vat)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatBDT(inv.total)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inv.paid ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={14} /> {t.paid}
                          {inv.paymentMethod ? ` · ${inv.paymentMethod.toUpperCase()}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <Clock size={14} /> {t.unpaid}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectInvoice(inv)}
                          title="View & Print"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-slate-100"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          title={t.delete}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
