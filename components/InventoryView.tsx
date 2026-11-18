import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Minus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { InventoryItem, Locale } from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';

interface InventoryViewProps {
  locale: Locale;
  items: InventoryItem[];
  onOpenAdd: () => void;
  onEditItem: (item: InventoryItem) => void;
  onAdjustQuantity: (item: InventoryItem, delta: number) => void;
  onDeleteItem: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  locale,
  items,
  onOpenAdd,
  onEditItem,
  onAdjustQuantity,
  onDeleteItem,
}) => {
  const t = TRANSLATIONS[locale];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'healthy'>('all');

  const filtered = items.filter((it) => {
    const isLow = it.quantity <= it.lowStockThreshold;
    if (filter === 'low' && !isLow) return false;
    if (filter === 'healthy' && isLow) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.sku.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
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
            placeholder={t.searchInventory}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.all}
            </button>
            <button
              type="button"
              onClick={() => setFilter('low')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'low'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.lowStock}
            </button>
            <button
              type="button"
              onClick={() => setFilter('healthy')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'healthy'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inStock}
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <Plus size={14} /> {t.addItem}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-500">{t.noInventory}</p>
            <button
              type="button"
              onClick={onOpenAdd}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              {t.addFirstItem}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs text-slate-500">
                  <th className="py-3 px-5 font-medium">{t.sku}</th>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">{t.category}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.unitPrice}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.quantity}</th>
                  <th className="py-3 px-4 font-medium text-right">{t.stockValue}</th>
                  <th className="py-3 px-4 font-medium">{t.status}</th>
                  <th className="py-3 px-5 font-medium text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((it) => {
                  const isLow = it.quantity <= it.lowStockThreshold;
                  return (
                    <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {it.sku}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{it.name}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{it.category}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatBDT(it.price)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAdjustQuantity(it, -1)}
                            disabled={it.quantity <= 0}
                            aria-label="Decrease stock"
                            className="p-1 text-slate-500 hover:text-slate-900 border border-slate-200 rounded hover:bg-white disabled:opacity-30"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-mono tabular-nums font-medium text-slate-900">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustQuantity(it, 1)}
                            aria-label="Increase stock"
                            className="p-1 text-slate-500 hover:text-slate-900 border border-slate-200 rounded hover:bg-white"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatBDT(it.quantity * it.price)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                            <AlertTriangle size={13} /> {t.lowStock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={13} /> {t.inStock}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditItem(it)}
                            title={t.edit}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-slate-100"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(it.id)}
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
    </div>
  );
};
