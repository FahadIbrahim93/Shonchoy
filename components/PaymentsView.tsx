import React, { useState } from 'react';
import { CheckCircle2, Plus, Search, Smartphone, Banknote } from 'lucide-react';
import type { Locale, Payment, PaymentMethod } from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';

interface PaymentsViewProps {
  locale: Locale;
  payments: Payment[];
  onOpenRecordPayment: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  locale,
  payments,
  onOpenRecordPayment,
}) => {
  const t = TRANSLATIONS[locale];
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');

  const filtered = payments.filter((p) => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.transactionId.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.invoiceNumber.toLowerCase().includes(q)
    );
  });

  const totalsByMethod = {
    bkash: payments
      .filter((p) => p.method === 'bkash')
      .reduce((s, p) => s + p.amount, 0),
    nagad: payments
      .filter((p) => p.method === 'nagad')
      .reduce((s, p) => s + p.amount, 0),
    cash: payments
      .filter((p) => p.method === 'cash')
      .reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>bKash Collections</span>
            <Smartphone size={15} className="text-pink-600" />
          </div>
          <p className="mt-2.5 text-xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatBDT(totalsByMethod.bkash)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Nagad Collections</span>
            <Smartphone size={15} className="text-amber-600" />
          </div>
          <p className="mt-2.5 text-xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatBDT(totalsByMethod.nagad)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Cash Register</span>
            <Banknote size={15} className="text-emerald-600" />
          </div>
          <p className="mt-2.5 text-xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatBDT(totalsByMethod.cash)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPayments}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'bkash', 'nagad', 'cash'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  methodFilter === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'all'
                  ? t.all
                  : m === 'bkash'
                  ? 'bKash'
                  : m === 'nagad'
                  ? 'Nagad'
                  : 'Cash'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRecordPayment}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <Plus size={14} /> {t.recordPayment}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">{t.noPayments}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">{t.transactionId}</th>
                  <th className="py-3 px-4 font-medium">{t.invoiceNo}</th>
                  <th className="py-3 px-4 font-medium">{t.customer}</th>
                  <th className="py-3 px-4 font-medium">{t.method}</th>
                  <th className="py-3 px-4 font-medium">{t.date}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.amount}</th>
                  <th className="py-3 px-5 font-medium text-right">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900">
                      {p.transactionId}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {p.customerName}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {p.method === 'bkash' ? 'bKash' : p.method === 'nagad' ? 'Nagad' : 'Cash'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatBDT(p.amount)}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 size={13} /> {t.completed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
