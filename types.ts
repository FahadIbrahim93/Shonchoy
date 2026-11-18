export type Locale = 'en' | 'bn';

export type ActiveView =
  | 'overview'
  | 'invoices'
  | 'customers'
  | 'inventory'
  | 'payments'
  | 'analytics';

export type PaymentMethod = 'bkash' | 'nagad' | 'cash';

export type PaymentStatus = 'completed' | 'pending' | 'failed';

export interface CustomerAddressEntry {
  address: string;
  recordedAt: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  currentAddress: string;
  addressHistory: CustomerAddressEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface InvoiceLineItem {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
  paid: boolean;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  method: PaymentMethod;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface ForecastPoint {
  date: string;
  label: string;
  actualRevenue: number | null;
  forecastRevenue: number | null;
}

export interface ShonchoySummary {
  totalRevenue: number;
  unpaidAmount: number;
  unpaidCount: number;
  inventoryValue: number;
  totalItems: number;
  lowStockCount: number;
  paidInvoicesCount: number;
  totalInvoicesCount: number;
}
