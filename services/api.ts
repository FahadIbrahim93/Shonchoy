import type {
  Customer,
  ForecastPoint,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  Locale,
  Payment,
  PaymentMethod,
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload as T;
}

export const api = {
  getItems: () => request<{ data: InventoryItem[] }>('/api/v1/items'),
  createItem: (body: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
    price: number;
    lowStockThreshold?: number;
  }) =>
    request<{ data: InventoryItem }>('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateItem: (id: string, body: Partial<InventoryItem>) =>
    request<{ data: InventoryItem }>(`/api/v1/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteItem: (id: string) =>
    request<{ message: string }>(`/api/v1/items/${id}`, {
      method: 'DELETE',
    }),

  getCustomers: () => request<{ data: Customer[] }>('/api/v1/customers'),
  createCustomer: (body: {
    name: string;
    phone: string;
    currentAddress: string;
    addressNote?: string;
  }) =>
    request<{ data: Customer }>('/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCustomer: (
    id: string,
    body: {
      name?: string;
      phone?: string;
      currentAddress?: string;
      addressNote?: string;
    }
  ) =>
    request<{ data: Customer }>(`/api/v1/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteCustomer: (id: string) =>
    request<{ message: string }>(`/api/v1/customers/${id}`, {
      method: 'DELETE',
    }),

  getInvoices: () => request<{ data: Invoice[] }>('/api/v1/invoices'),
  createInvoice: (body: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    items: InvoiceLineItem[];
    vatRate: number;
    paid: boolean;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
  }) =>
    request<{ data: Invoice }>('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteInvoice: (id: string) =>
    request<{ message: string }>(`/api/v1/invoices/${id}`, {
      method: 'DELETE',
    }),

  getPayments: () => request<{ data: Payment[] }>('/api/v1/payments'),
  recordPayment: (body: {
    invoiceId: string;
    method: PaymentMethod;
    transactionId: string;
    amount: number;
  }) =>
    request<{ data: Payment }>('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getForecast: () => request<{ data: ForecastPoint[] }>('/api/v1/forecast'),

  askAssistant: (question: string, locale: Locale) =>
    request<{ answer: string }>('/api/v1/assistant', {
      method: 'POST',
      body: JSON.stringify({ question, locale }),
    }),
};
