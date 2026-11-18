import React, { useState } from 'react';
import { X, Plus, Trash2, Printer, CheckCircle2, Clock } from 'lucide-react';
import type {
  Customer,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  Locale,
  PaymentMethod,
} from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';

interface CreateInvoiceModalProps {
  locale: Locale;
  items: InventoryItem[];
  customers: Customer[];
  onClose: () => void;
  onSubmit: (payload: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    items: InvoiceLineItem[];
    vatRate: number;
    paid: boolean;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
  }) => Promise<void>;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  locale,
  items,
  customers,
  onClose,
  onSubmit,
}) => {
  const t = TRANSLATIONS[locale];
  const availableItems = items.filter((it) => it.quantity > 0);
  const firstItem = availableItems[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [vatRate, setVatRate] = useState(5);
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [lines, setLines] = useState<InvoiceLineItem[]>(
    firstItem
      ? [
          {
            itemId: firstItem.id,
            name: firstItem.name,
            sku: firstItem.sku,
            quantity: 1,
            price: firstItem.price,
          },
        ]
      : []
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.price, 0);
  const vat = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  const handleLineItemChange = (index: number, itemId: string) => {
    const selected = items.find((it) => it.id === itemId);
    if (!selected) return;
    setLines((prev) =>
      prev.map((l, idx) =>
        idx === index
          ? {
              itemId: selected.id,
              name: selected.name,
              sku: selected.sku,
              quantity: Math.min(l.quantity, Math.max(1, selected.quantity)),
              price: selected.price,
            }
          : l
      )
    );
  };

  const handleQtyChange = (index: number, qty: number) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  };

  const handleAddLine = () => {
    if (!firstItem) return;
    setLines((prev) => [
      ...prev,
      {
        itemId: firstItem.id,
        name: firstItem.name,
        sku: firstItem.sku,
        quantity: 1,
        price: firstItem.price,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      return;
    }
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerAddress(found.currentAddress);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one line item.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        items: lines,
        vatRate,
        paid,
        paymentMethod: paid ? paymentMethod : undefined,
        transactionId: paid ? transactionId.trim() || undefined : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t.createInvoice}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {customers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t.selectCustomer}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="">{t.newCustomerOption}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t.customer} *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Karim Enterprise"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t.phone}
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+880 17XX-XXXXXX"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              {t.address}
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="e.g. House 14, Road 7, Banani, Dhaka"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">{t.items}</label>
              <button
                type="button"
                onClick={handleAddLine}
                disabled={availableItems.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 whitespace-nowrap"
              >
                <Plus size={14} /> {t.addLineItem}
              </button>
            </div>

            {availableItems.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                No inventory items with available stock. Add stock in Inventory first.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lines.map((line, idx) => {
                  const inv = items.find((it) => it.id === line.itemId);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center border border-slate-200 rounded-lg p-2.5"
                    >
                      <div className="col-span-6">
                        <select
                          value={line.itemId}
                          onChange={(e) => handleLineItemChange(idx, e.target.value)}
                          className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-emerald-600"
                        >
                          {availableItems.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({it.quantity} avail.)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          max={inv?.quantity || 999}
                          value={line.quantity}
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                          className="w-full text-sm px-2.5 py-1.5 border border-slate-200 rounded-md font-mono tabular-nums text-right focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div className="col-span-3 text-right font-mono tabular-nums text-sm text-slate-700">
                        {formatBDT(line.quantity * line.price)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={lines.length === 1}
                          aria-label={t.delete}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">VAT (%)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={vatRate}
                  onChange={(e) => setVatRate(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2.5 py-1 text-sm border border-slate-200 rounded-md font-mono tabular-nums text-right"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Mark invoice as paid immediately
              </label>

              {paid && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md bg-white"
                  >
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="cash">Cash</option>
                  </select>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Txn ID (optional)"
                    className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md font-mono"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t.subtotal}</span>
                <span className="font-mono tabular-nums">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {t.vat} ({vatRate}%)
                </span>
                <span className="font-mono tabular-nums">{formatBDT(vat)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t border-slate-200">
                <span>{t.total}</span>
                <span className="font-mono tabular-nums text-base">{formatBDT(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || availableItems.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? '...' : t.createInvoice}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InvoiceDetailModalProps {
  locale: Locale;
  invoice: Invoice;
  onClose: () => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  locale,
  invoice,
  onClose,
  onRecordPayment,
}) => {
  const t = TRANSLATIONS[locale];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="print-only-sheet bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden">
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {invoice.invoiceNumber}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              <Printer size={14} /> {t.print}
            </button>
            {!invoice.paid && (
              <button
                type="button"
                onClick={() => onRecordPayment(invoice)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap"
              >
                {t.markPaid}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-xl font-bold text-slate-900">Shonchoy</p>
              <p className="text-xs text-slate-500 mt-1">
                Invoice Management & Store Ledger
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold text-slate-900">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                {new Date(invoice.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium">
                {invoice.paid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 size={14} /> {t.paid}
                    {invoice.paymentMethod ? ` · ${invoice.paymentMethod.toUpperCase()}` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Clock size={14} /> {t.unpaid}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">{t.customer}</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {invoice.customerName}
            </p>
            {invoice.customerPhone && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {invoice.customerPhone}
              </p>
            )}
            {invoice.customerAddress && (
              <p className="text-xs text-slate-600 mt-0.5">
                {invoice.customerAddress}
              </p>
            )}
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 font-medium">{t.items}</th>
                <th className="py-2 font-medium text-right">{t.quantity}</th>
                <th className="py-2 font-medium text-right">{t.unitPrice}</th>
                <th className="py-2 font-medium text-right">{t.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((line, i) => (
                <tr key={i}>
                  <td className="py-3">
                    <p className="font-medium text-slate-900">{line.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{line.sku}</p>
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-slate-700">
                    {line.quantity}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-slate-700">
                    {formatBDT(line.price)}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums font-medium text-slate-900">
                    {formatBDT(line.quantity * line.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t.subtotal}</span>
                <span className="font-mono tabular-nums">{formatBDT(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {t.vat} ({invoice.vatRate}%)
                </span>
                <span className="font-mono tabular-nums">{formatBDT(invoice.vat)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>{t.total}</span>
                <span className="font-mono tabular-nums">{formatBDT(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ItemFormModalProps {
  locale: Locale;
  editingItem: InventoryItem | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    price: number;
    lowStockThreshold: number;
  }) => Promise<void>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  locale,
  editingItem,
  onClose,
  onSubmit,
}) => {
  const t = TRANSLATIONS[locale];
  const [name, setName] = useState(editingItem?.name || '');
  const [sku, setSku] = useState(editingItem?.sku || '');
  const [category, setCategory] = useState(editingItem?.category || 'Staples');
  const [quantity, setQuantity] = useState(editingItem?.quantity ?? 20);
  const [price, setPrice] = useState(editingItem?.price ?? 500);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    editingItem?.lowStockThreshold ?? 10
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !sku.trim()) {
      setError('Item name and SKU are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim() || 'General',
        quantity: Math.max(0, Number(quantity)),
        price: Math.max(0.01, Number(price)),
        lowStockThreshold: Math.max(1, Number(lowStockThreshold)),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingItem ? t.edit : t.addItem}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kalijira Aromatic Rice (25kg)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.sku} *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(editingItem)}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SHN-RICE-025"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.category}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Staples"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t.quantity}
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Price (৳)
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Alert Min
              </label>
              <input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? '...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RecordPaymentModalProps {
  locale: Locale;
  unpaidInvoices: Invoice[];
  initialInvoiceId?: string;
  onClose: () => void;
  onSubmit: (payload: {
    invoiceId: string;
    method: PaymentMethod;
    transactionId: string;
    amount: number;
  }) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  locale,
  unpaidInvoices,
  initialInvoiceId,
  onClose,
  onSubmit,
}) => {
  const t = TRANSLATIONS[locale];
  const initialInv =
    unpaidInvoices.find((i) => i.id === initialInvoiceId) || unpaidInvoices[0];

  const [invoiceId, setInvoiceId] = useState(initialInv?.id || '');
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState(initialInv?.total || 0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInvoiceChange = (nextId: string) => {
    setInvoiceId(nextId);
    const inv = unpaidInvoices.find((i) => i.id === nextId);
    if (inv) setAmount(inv.total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!invoiceId || !transactionId.trim()) {
      setError('Select an invoice and enter a valid Transaction ID.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        invoiceId,
        method,
        transactionId: transactionId.trim().toUpperCase(),
        amount: Number(amount),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t.recordPayment}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {unpaidInvoices.length === 0 ? (
            <p className="text-sm text-slate-600">All invoices are already settled.</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.invoiceNo}
                </label>
                <select
                  value={invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} ({formatBDT(inv.total)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {t.method}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bkash', 'nagad', 'cash'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                        method === m
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'bkash' ? 'bKash' : m === 'nagad' ? 'Nagad' : 'Cash'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.transactionId} *
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={method === 'bkash' ? 'e.g. BKS8X42K90' : method === 'nagad' ? 'e.g. NGD55019283' : 'e.g. CSH-2026-09'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t.amount}
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            {unpaidInvoices.length > 0 && (
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? '...' : t.save}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

interface CustomerFormModalProps {
  locale: Locale;
  editingCustomer: Customer | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    phone: string;
    currentAddress: string;
    addressNote?: string;
  }) => Promise<void>;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  locale,
  editingCustomer,
  onClose,
  onSubmit,
}) => {
  const t = TRANSLATIONS[locale];
  const [name, setName] = useState(editingCustomer?.name || '');
  const [phone, setPhone] = useState(editingCustomer?.phone || '');
  const [currentAddress, setCurrentAddress] = useState(
    editingCustomer?.currentAddress || ''
  );
  const [addressNote, setAddressNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addressChanged =
    editingCustomer &&
    currentAddress.trim().toLowerCase() !==
      editingCustomer.currentAddress.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        currentAddress: currentAddress.trim(),
        addressNote: addressNote.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingCustomer ? t.editCustomer : t.addCustomer}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.customer} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahman General Store"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.phone}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 17XX-XXXXXX"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.currentAddress}
            </label>
            <textarea
              rows={2}
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
              placeholder="e.g. House 14, Road 7, Banani Bazar, Dhaka"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 resize-none"
            />
            {editingCustomer && (
              <p className="text-xs text-slate-500 mt-1">{t.addressHistoryHint}</p>
            )}
          </div>

          {(!editingCustomer || addressChanged) && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Address Note (optional)
              </label>
              <input
                type="text"
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="e.g. Main warehouse, Relocated branch"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? '...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
