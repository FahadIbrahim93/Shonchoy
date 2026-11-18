import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ActiveView,
  ForecastPoint,
  InventoryItem,
  Invoice,
  Locale,
  ShonchoySummary,
} from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';

interface OverviewViewProps {
  locale: Locale;
  summary: ShonchoySummary;
  invoices: Invoice[];
  items: InventoryItem[];
  forecast: ForecastPoint[];
  onNavigate: (view: ActiveView) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onQuickRestock: (item: InventoryItem) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  locale,
  summary,
  invoices,
  items,
  forecast,
  onNavigate,
  onSelectInvoice,
  onQuickRestock,
}) => {
  const t = TRANSLATIONS[locale];
  const lowStockItems = items.filter((it) => it.quantity <= it.lowStockThreshold);

  return (
    <div className="space-y-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{t.totalRevenue}</span>
            <TrendingUp size={15} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatBDT(summary.totalRevenue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.paidInvoicesCount} / {summary.totalInvoicesCount} {t.paid.toLowerCase()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{t.unpaidDues}</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatBDT(summary.unpaidAmount)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.unpaidCount} {t.invoices.toLowerCase()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{t.inventoryValue}</span>
            <Package size={15} className="text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {formatBDT(summary.inventoryValue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.totalItems} SKUs tracked
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{t.lowStockAlerts}</span>
            <AlertTriangle
              size={15}
              className={summary.lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {summary.lowStockCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {summary.lowStockCount > 0 ? 'Action needed soon' : 'All stock healthy'}
          </p>
        </div>
      </div>

      {/* Revenue & Forecast Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t.revenueForecast}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.actualSales} · {t.projectedForecast} (BDT)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
          >
            {t.analytics} <ArrowRight size={14} />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `৳${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(value: number | string | undefined) =>
                  typeof value === 'number' ? formatBDT(value) : ''
                }
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="actualRevenue"
                name={t.actualSales}
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.14}
                strokeWidth={2}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecastRevenue"
                name={t.projectedForecast}
                stroke="#0284c7"
                strokeDasharray="5 4"
                fill="#0284c7"
                fillOpacity={0.08}
                strokeWidth={2}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">{t.recentInvoices}</h2>
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              {t.viewAll}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="py-2.5 px-5 font-medium">{t.invoiceNo}</th>
                  <th className="py-2.5 px-4 font-medium">{t.customer}</th>
                  <th className="py-2.5 px-4 font-medium text-right">{t.total}</th>
                  <th className="py-2.5 px-5 font-medium text-right">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={13} className="text-slate-400" />
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium truncate max-w-[180px]">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {formatBDT(inv.total)}
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
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
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">{t.stockWatchlist}</h2>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              {t.viewAll}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(lowStockItems.length > 0 ? lowStockItems : items.slice(0, 4)).map((it) => {
              const isLow = it.quantity <= it.lowStockThreshold;
              return (
                <div
                  key={it.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{it.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                      {it.sku} · {it.quantity} left (min {it.lowStockThreshold})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuickRestock(it)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors ${
                      isLow
                        ? 'border-red-200 text-red-700 hover:bg-red-50'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    +10 Stock
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
