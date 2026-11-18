import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileText,
  History,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Customer, Invoice, Locale } from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';

interface CustomersViewProps {
  locale: Locale;
  customers: Customer[];
  invoices: Invoice[];
  onOpenAdd: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  locale,
  customers,
  invoices,
  onOpenAdd,
  onEditCustomer,
  onDeleteCustomer,
  onSelectInvoice,
}) => {
  const t = TRANSLATIONS[locale];
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const invoicesByCustomer = useMemo(() => {
    const map = new Map<string, Invoice[]>();
    for (const c of customers) {
      map.set(c.id, []);
    }
    for (const inv of invoices) {
      let targetId = inv.customerId;
      if (!targetId) {
        const match = customers.find(
          (c) =>
            c.name.toLowerCase() === inv.customerName.toLowerCase() ||
            (inv.customerPhone && c.phone === inv.customerPhone)
        );
        targetId = match?.id;
      }
      if (targetId) {
        const list = map.get(targetId);
        if (list) list.push(inv);
        else map.set(targetId, [inv]);
      }
    }
    return map;
  }, [customers, invoices]);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.currentAddress.toLowerCase().includes(q) ||
      c.addressHistory.some((h) => h.address.toLowerCase().includes(q))
    );
  });

  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId) || null
    : null;
  const selectedInvoices = selectedCustomer
    ? invoicesByCustomer.get(selectedCustomer.id) || []
    : [];

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
            placeholder={t.searchCustomers}
            aria-label={t.searchCustomers}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t.clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          <Plus size={14} /> {t.addCustomer}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-500">{t.noCustomers}</p>
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
                onClick={onOpenAdd}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                {t.addFirstCustomer}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">{t.customer}</th>
                  <th className="py-3 px-4 font-medium">{t.currentAddress}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.linkedInvoices}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.totalBilled}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.unpaidBalance}</th>
                  <th className="py-3 px-5 font-medium text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const linked = invoicesByCustomer.get(c.id) || [];
                  const totalBilled = linked.reduce((s, inv) => s + inv.total, 0);
                  const unpaidBalance = linked
                    .filter((inv) => !inv.paid)
                    .reduce((s, inv) => s + inv.total, 0);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-5">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        {c.phone && (
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {c.phone}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-700 truncate">
                          {c.currentAddress || '—'}
                        </p>
                        {c.addressHistory.length > 1 && (
                          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                            {c.addressHistory.length} addresses in history
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {linked.length}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatBDT(totalBilled)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            unpaidBalance > 0
                              ? 'text-amber-700 font-medium'
                              : 'text-slate-400'
                          }
                        >
                          {formatBDT(unpaidBalance)}
                        </span>
                      </td>
                      <td
                        className="py-3 px-5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerId(c.id)}
                            title="View Profile & History"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-slate-100"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditCustomer(c)}
                            title={t.edit}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-slate-100"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedCustomerId === c.id) {
                                setSelectedCustomerId(null);
                              }
                              onDeleteCustomer(c.id);
                            }}
                            title={t.delete}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                          >
                            <Trash2 size={14} />
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

      {/* Customer Detail Modal: Address History & Linked Invoices */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedCustomerId(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedCustomer.name}
                </h2>
                {selectedCustomer.phone && (
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} /> {selectedCustomer.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditCustomer(selectedCustomer)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                >
                  <Edit3 size={13} /> {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  aria-label={t.close}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Address History */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <History size={13} /> {t.addressHistory}
                </h3>
                {selectedCustomer.addressHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No addresses recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {[...selectedCustomer.addressHistory].reverse().map((entry, idx) => (
                      <div
                        key={`${entry.recordedAt}-${idx}`}
                        className="p-3.5 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <MapPin
                            size={15}
                            className={`mt-0.5 shrink-0 ${
                              idx === 0 ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {entry.address}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {idx === 0 ? 'Current' : 'Previous'}
                              {entry.note ? ` · ${entry.note}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                          {new Date(entry.recordedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Invoices */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <FileText size={13} /> {t.linkedInvoices} ({selectedInvoices.length})
                </h3>
                {selectedInvoices.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.noLinkedInvoices}</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs text-slate-500">
                          <th className="py-2.5 px-4 font-medium">{t.invoiceNo}</th>
                          <th className="py-2.5 px-4 font-medium">{t.date}</th>
                          <th className="py-2.5 px-4 font-medium text-right">{t.total}</th>
                          <th className="py-2.5 px-4 font-medium text-right">{t.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            onClick={() => {
                              setSelectedCustomerId(null);
                              onSelectInvoice(inv);
                            }}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-4 font-mono text-xs font-medium text-slate-900 tabular-nums">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-xs text-slate-500 tabular-nums">
                              {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                              {formatBDT(inv.total)}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              {inv.paid ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                  <CheckCircle2 size={13} /> {t.paid}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                  <Clock size={13} /> {t.unpaid}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
