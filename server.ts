import fs from 'fs';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import type {
  Customer,
  ForecastPoint,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  Payment,
  PaymentMethod,
} from './types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

interface ShonchoyStore {
  items: InventoryItem[];
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'shonchoy-db.json');

function createSeedData(): ShonchoyStore {
  const now = Date.now();
  const day = 86_400_000;

  const items: InventoryItem[] = [
    {
      id: 'itm-1',
      name: 'Miniket Premium Rice (50kg)',
      sku: 'SHN-RICE-050',
      category: 'Staples',
      quantity: 42,
      price: 3450,
      lowStockThreshold: 12,
      updatedAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: 'itm-2',
      name: 'Soybean Cooking Oil (5L)',
      sku: 'SHN-OIL-005',
      category: 'Cooking Essentials',
      quantity: 8,
      price: 880,
      lowStockThreshold: 15,
      updatedAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: 'itm-3',
      name: 'Sylhet Loose Leaf Tea (1kg)',
      sku: 'SHN-TEA-001',
      category: 'Beverages',
      quantity: 64,
      price: 520,
      lowStockThreshold: 10,
      updatedAt: new Date(now - 3 * day).toISOString(),
    },
    {
      id: 'itm-4',
      name: 'Deshi Red Lentils (25kg)',
      sku: 'SHN-DAL-025',
      category: 'Staples',
      quantity: 6,
      price: 3100,
      lowStockThreshold: 10,
      updatedAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: 'itm-5',
      name: 'Pure Mustard Oil (1L)',
      sku: 'SHN-OIL-001',
      category: 'Cooking Essentials',
      quantity: 35,
      price: 320,
      lowStockThreshold: 12,
      updatedAt: new Date(now - 4 * day).toISOString(),
    },
    {
      id: 'itm-6',
      name: 'Thermal POS Receipt Rolls (20pk)',
      sku: 'SHN-SUP-020',
      category: 'Store Supplies',
      quantity: 19,
      price: 750,
      lowStockThreshold: 8,
      updatedAt: new Date(now - 5 * day).toISOString(),
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Rahman General Store',
      phone: '+880 1711-482910',
      currentAddress: 'House 14, Road 7, Banani Bazar, Dhaka 1213',
      addressHistory: [
        {
          address: 'Shop 9, Gulshan-1 DCC Market, Dhaka 1212',
          recordedAt: new Date(now - 90 * day).toISOString(),
          note: 'Original shop location',
        },
        {
          address: 'House 14, Road 7, Banani Bazar, Dhaka 1213',
          recordedAt: new Date(now - 18 * day).toISOString(),
          note: 'Expanded main warehouse',
        },
      ],
      createdAt: new Date(now - 90 * day).toISOString(),
      updatedAt: new Date(now - 18 * day).toISOString(),
    },
    {
      id: 'cust-2',
      name: 'Nadia Traders, Mirpur',
      phone: '+880 1819-304112',
      currentAddress: 'Plot 22, Section 10, Mirpur, Dhaka 1216',
      addressHistory: [
        {
          address: 'Plot 22, Section 10, Mirpur, Dhaka 1216',
          recordedAt: new Date(now - 60 * day).toISOString(),
          note: 'Primary storefront',
        },
      ],
      createdAt: new Date(now - 60 * day).toISOString(),
      updatedAt: new Date(now - 60 * day).toISOString(),
    },
    {
      id: 'cust-3',
      name: 'Green Mart Dhanmondi',
      phone: '+880 1912-774520',
      currentAddress: 'House 48, Satmasjid Road, Dhanmondi, Dhaka 1209',
      addressHistory: [
        {
          address: 'Road 27, Dhanmondi, Dhaka 1209',
          recordedAt: new Date(now - 120 * day).toISOString(),
          note: 'Initial branch',
        },
        {
          address: 'House 48, Satmasjid Road, Dhanmondi, Dhaka 1209',
          recordedAt: new Date(now - 25 * day).toISOString(),
          note: 'Relocated showroom',
        },
      ],
      createdAt: new Date(now - 120 * day).toISOString(),
      updatedAt: new Date(now - 25 * day).toISOString(),
    },
    {
      id: 'cust-4',
      name: 'Bismillah Super Shop',
      phone: '+880 1670-991244',
      currentAddress: '108 Elephant Road, New Market, Dhaka 1205',
      addressHistory: [
        {
          address: '108 Elephant Road, New Market, Dhaka 1205',
          recordedAt: new Date(now - 45 * day).toISOString(),
          note: 'Primary delivery address',
        },
      ],
      createdAt: new Date(now - 45 * day).toISOString(),
      updatedAt: new Date(now - 45 * day).toISOString(),
    },
    {
      id: 'cust-5',
      name: 'Uttara Fresh Corner',
      phone: '+880 1755-612098',
      currentAddress: 'Sector 7, Lake Drive Road, Uttara, Dhaka 1230',
      addressHistory: [
        {
          address: 'Sector 7, Lake Drive Road, Uttara, Dhaka 1230',
          recordedAt: new Date(now - 30 * day).toISOString(),
          note: 'Primary storefront',
        },
      ],
      createdAt: new Date(now - 30 * day).toISOString(),
      updatedAt: new Date(now - 30 * day).toISOString(),
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv-1001',
      invoiceNumber: 'INV-2026-1001',
      customerId: 'cust-1',
      customerName: 'Rahman General Store',
      customerPhone: '+880 1711-482910',
      customerAddress: 'House 14, Road 7, Banani Bazar, Dhaka 1213',
      items: [
        { itemId: 'itm-1', name: 'Miniket Premium Rice (50kg)', sku: 'SHN-RICE-050', quantity: 5, price: 3450 },
        { itemId: 'itm-2', name: 'Soybean Cooking Oil (5L)', sku: 'SHN-OIL-005', quantity: 10, price: 880 },
      ],
      subtotal: 26050,
      vatRate: 5,
      vat: 1302.5,
      total: 27352.5,
      paid: true,
      paymentMethod: 'bkash',
      createdAt: new Date(now - 5 * day).toISOString(),
    },
    {
      id: 'inv-1002',
      invoiceNumber: 'INV-2026-1002',
      customerId: 'cust-2',
      customerName: 'Nadia Traders, Mirpur',
      customerPhone: '+880 1819-304112',
      customerAddress: 'Plot 22, Section 10, Mirpur, Dhaka 1216',
      items: [
        { itemId: 'itm-3', name: 'Sylhet Loose Leaf Tea (1kg)', sku: 'SHN-TEA-001', quantity: 14, price: 520 },
        { itemId: 'itm-5', name: 'Pure Mustard Oil (1L)', sku: 'SHN-OIL-001', quantity: 12, price: 320 },
      ],
      subtotal: 11120,
      vatRate: 5,
      vat: 556,
      total: 11676,
      paid: true,
      paymentMethod: 'nagad',
      createdAt: new Date(now - 3 * day).toISOString(),
    },
    {
      id: 'inv-1003',
      invoiceNumber: 'INV-2026-1003',
      customerId: 'cust-3',
      customerName: 'Green Mart Dhanmondi',
      customerPhone: '+880 1912-774520',
      customerAddress: 'House 48, Satmasjid Road, Dhanmondi, Dhaka 1209',
      items: [
        { itemId: 'itm-4', name: 'Deshi Red Lentils (25kg)', sku: 'SHN-DAL-025', quantity: 6, price: 3100 },
        { itemId: 'itm-6', name: 'Thermal POS Receipt Rolls (20pk)', sku: 'SHN-SUP-020', quantity: 4, price: 750 },
      ],
      subtotal: 21600,
      vatRate: 5,
      vat: 1080,
      total: 22680,
      paid: false,
      createdAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: 'inv-1004',
      invoiceNumber: 'INV-2026-1004',
      customerId: 'cust-4',
      customerName: 'Bismillah Super Shop',
      customerPhone: '+880 1670-991244',
      customerAddress: '108 Elephant Road, New Market, Dhaka 1205',
      items: [
        { itemId: 'itm-1', name: 'Miniket Premium Rice (50kg)', sku: 'SHN-RICE-050', quantity: 4, price: 3450 },
        { itemId: 'itm-3', name: 'Sylhet Loose Leaf Tea (1kg)', sku: 'SHN-TEA-001', quantity: 8, price: 520 },
      ],
      subtotal: 17960,
      vatRate: 5,
      vat: 898,
      total: 18858,
      paid: true,
      paymentMethod: 'cash',
      createdAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: 'inv-1005',
      invoiceNumber: 'INV-2026-1005',
      customerId: 'cust-5',
      customerName: 'Uttara Fresh Corner',
      customerPhone: '+880 1755-612098',
      customerAddress: 'Sector 7, Lake Drive Road, Uttara, Dhaka 1230',
      items: [
        { itemId: 'itm-2', name: 'Soybean Cooking Oil (5L)', sku: 'SHN-OIL-005', quantity: 6, price: 880 },
        { itemId: 'itm-5', name: 'Pure Mustard Oil (1L)', sku: 'SHN-OIL-001', quantity: 10, price: 320 },
      ],
      subtotal: 8480,
      vatRate: 5,
      vat: 424,
      total: 8904,
      paid: false,
      createdAt: new Date(now).toISOString(),
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay-501',
      invoiceId: 'inv-1001',
      invoiceNumber: 'INV-2026-1001',
      customerName: 'Rahman General Store',
      method: 'bkash',
      transactionId: 'BKS9F28K41M',
      amount: 27352.5,
      status: 'completed',
      createdAt: new Date(now - 5 * day).toISOString(),
    },
    {
      id: 'pay-502',
      invoiceId: 'inv-1002',
      invoiceNumber: 'INV-2026-1002',
      customerName: 'Nadia Traders, Mirpur',
      method: 'nagad',
      transactionId: 'NGD44109822',
      amount: 11676,
      status: 'completed',
      createdAt: new Date(now - 3 * day).toISOString(),
    },
    {
      id: 'pay-503',
      invoiceId: 'inv-1004',
      invoiceNumber: 'INV-2026-1004',
      customerName: 'Bismillah Super Shop',
      method: 'cash',
      transactionId: 'CSH-20261115-01',
      amount: 18858,
      status: 'completed',
      createdAt: new Date(now - 1 * day).toISOString(),
    },
  ];

  return { items, customers, invoices, payments };
}

function readStore(): ShonchoyStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ShonchoyStore>;
    const seed = createSeedData();
    let dirty = false;

    const items = Array.isArray(parsed.items) ? parsed.items : seed.items;
    const invoices = Array.isArray(parsed.invoices) ? parsed.invoices : seed.invoices;
    const payments = Array.isArray(parsed.payments) ? parsed.payments : seed.payments;
    let customers: Customer[] = Array.isArray(parsed.customers) ? parsed.customers : [];

    if (!Array.isArray(parsed.customers)) {
      dirty = true;
      customers = [...seed.customers];
      for (const inv of invoices) {
        let matched = customers.find(
          (c) =>
            c.name.toLowerCase() === inv.customerName.toLowerCase() ||
            (inv.customerPhone && c.phone === inv.customerPhone)
        );
        if (!matched) {
          matched = {
            id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: inv.customerName,
            phone: inv.customerPhone || '',
            currentAddress: inv.customerAddress || 'Dhaka, Bangladesh',
            addressHistory: [
              {
                address: inv.customerAddress || 'Dhaka, Bangladesh',
                recordedAt: inv.createdAt,
                note: 'Imported from invoice',
              },
            ],
            createdAt: inv.createdAt,
            updatedAt: inv.createdAt,
          };
          customers.push(matched);
        }
        if (!inv.customerId) {
          inv.customerId = matched.id;
        }
        if (!inv.customerAddress) {
          inv.customerAddress = matched.currentAddress;
        }
      }
    }

    const store: ShonchoyStore = { items, customers, invoices, payments };
    if (dirty) {
      writeStore(store);
    }
    return store;
  } catch {
    const seed = createSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function writeStore(store: ShonchoyStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function buildForecast(invoices: Invoice[]): ForecastPoint[] {
  const dayMs = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDay = new Map<string, number>();
  for (const inv of invoices) {
    const d = new Date(inv.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + inv.total);
  }

  const points: ForecastPoint[] = [];
  const historicalValues: number[] = [];

  for (let offset = -6; offset <= 0; offset++) {
    const d = new Date(today.getTime() + offset * dayMs);
    const key = d.toISOString().slice(0, 10);
    const actual = Math.round(byDay.get(key) || 0);
    historicalValues.push(actual);
    points.push({
      date: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actualRevenue: actual,
      forecastRevenue: offset === 0 ? actual : null,
    });
  }

  const nonZero = historicalValues.filter((v) => v > 0);
  const avg = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 12000;

  for (let offset = 1; offset <= 7; offset++) {
    const d = new Date(today.getTime() + offset * dayMs);
    const key = d.toISOString().slice(0, 10);
    const trendFactor = 1 + offset * 0.035;
    const weekdayWave = 1 + Math.sin(offset * 1.1) * 0.08;
    const projected = Math.round(avg * trendFactor * weekdayWave);
    points.push({
      date: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actualRevenue: null,
      forecastRevenue: projected,
    });
  }

  return points;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Inventory Endpoints
  app.get('/api/v1/items', (_req, res) => {
    const store = readStore();
    res.json({ data: store.items });
  });

  app.post('/api/v1/items', (req, res) => {
    const { name, sku, category, quantity, price, lowStockThreshold } = req.body ?? {};
    if (!name || !sku || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Name, SKU, and a positive price are required.' });
    }
    const store = readStore();
    if (store.items.some((it) => it.sku.toLowerCase() === String(sku).trim().toLowerCase())) {
      return res.status(409).json({ error: 'An inventory item with this SKU already exists.' });
    }
    const newItem: InventoryItem = {
      id: `itm-${Date.now()}`,
      name: String(name).trim(),
      sku: String(sku).trim().toUpperCase(),
      category: String(category || 'General').trim(),
      quantity: Math.max(0, Number(quantity) || 0),
      price: Number(price),
      lowStockThreshold: Math.max(1, Number(lowStockThreshold) || Number(process.env.LOW_STOCK_THRESHOLD) || 10),
      updatedAt: new Date().toISOString(),
    };
    store.items.unshift(newItem);
    writeStore(store);
    return res.status(201).json({ data: newItem });
  });

  app.patch('/api/v1/items/:id', (req, res) => {
    const store = readStore();
    const idx = store.items.findIndex((it) => it.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    const current = store.items[idx];
    const updated: InventoryItem = {
      ...current,
      name: req.body.name !== undefined ? String(req.body.name).trim() : current.name,
      category: req.body.category !== undefined ? String(req.body.category).trim() : current.category,
      quantity: req.body.quantity !== undefined ? Math.max(0, Number(req.body.quantity)) : current.quantity,
      price: req.body.price !== undefined ? Math.max(0.01, Number(req.body.price)) : current.price,
      lowStockThreshold:
        req.body.lowStockThreshold !== undefined
          ? Math.max(1, Number(req.body.lowStockThreshold))
          : current.lowStockThreshold,
      updatedAt: new Date().toISOString(),
    };
    store.items[idx] = updated;
    writeStore(store);
    return res.json({ data: updated });
  });

  app.delete('/api/v1/items/:id', (req, res) => {
    const store = readStore();
    const next = store.items.filter((it) => it.id !== req.params.id);
    if (next.length === store.items.length) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    store.items = next;
    writeStore(store);
    return res.json({ message: 'Item deleted.' });
  });

  // Customer Endpoints
  app.get('/api/v1/customers', (_req, res) => {
    const store = readStore();
    res.json({ data: store.customers });
  });

  app.post('/api/v1/customers', (req, res) => {
    const { name, phone, currentAddress, addressNote } = req.body ?? {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    const store = readStore();
    const nowIso = new Date().toISOString();
    const cleanAddress = String(currentAddress || '').trim();
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      currentAddress: cleanAddress,
      addressHistory: cleanAddress
        ? [
            {
              address: cleanAddress,
              recordedAt: nowIso,
              note: addressNote ? String(addressNote).trim() : 'Initial address',
            },
          ]
        : [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.customers.unshift(newCustomer);
    writeStore(store);
    return res.status(201).json({ data: newCustomer });
  });

  app.patch('/api/v1/customers/:id', (req, res) => {
    const store = readStore();
    const idx = store.customers.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const current = store.customers[idx];
    const nowIso = new Date().toISOString();
    const nextAddress =
      req.body.currentAddress !== undefined
        ? String(req.body.currentAddress).trim()
        : current.currentAddress;

    const addressHistory = [...current.addressHistory];
    if (
      nextAddress &&
      nextAddress.toLowerCase() !== current.currentAddress.trim().toLowerCase()
    ) {
      addressHistory.push({
        address: nextAddress,
        recordedAt: nowIso,
        note: req.body.addressNote ? String(req.body.addressNote).trim() : 'Updated address',
      });
    }

    const updated: Customer = {
      ...current,
      name: req.body.name !== undefined ? String(req.body.name).trim() : current.name,
      phone: req.body.phone !== undefined ? String(req.body.phone).trim() : current.phone,
      currentAddress: nextAddress,
      addressHistory,
      updatedAt: nowIso,
    };
    store.customers[idx] = updated;
    writeStore(store);
    return res.json({ data: updated });
  });

  app.delete('/api/v1/customers/:id', (req, res) => {
    const store = readStore();
    const next = store.customers.filter((c) => c.id !== req.params.id);
    if (next.length === store.customers.length) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    store.customers = next;
    writeStore(store);
    return res.json({ message: 'Customer deleted.' });
  });

  // Invoice Endpoints
  app.get('/api/v1/invoices', (_req, res) => {
    const store = readStore();
    res.json({ data: store.invoices });
  });

  app.post('/api/v1/invoices', (req, res) => {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      vatRate = 5,
      paid = false,
      paymentMethod,
      transactionId,
    } = req.body ?? {};

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer name and at least one line item are required.' });
    }

    const store = readStore();
    const resolvedLines: InvoiceLineItem[] = [];

    for (const line of items as InvoiceLineItem[]) {
      const invItem = store.items.find((it) => it.id === line.itemId);
      const qty = Number(line.quantity);
      const unitPrice = Number(line.price);
      if (!invItem || qty <= 0 || unitPrice <= 0) {
        return res.status(400).json({ error: 'Invalid line item or quantity.' });
      }
      if (invItem.quantity < qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${invItem.name} (available: ${invItem.quantity}).`,
        });
      }
      invItem.quantity -= qty;
      invItem.updatedAt = new Date().toISOString();
      resolvedLines.push({
        itemId: invItem.id,
        name: invItem.name,
        sku: invItem.sku,
        quantity: qty,
        price: unitPrice,
      });
    }

    const nowIso = new Date().toISOString();
    const cleanName = String(customerName).trim();
    const cleanPhone = customerPhone ? String(customerPhone).trim() : '';
    const cleanAddress = customerAddress ? String(customerAddress).trim() : '';

    let linkedCustomer = customerId
      ? store.customers.find((c) => c.id === customerId)
      : store.customers.find(
          (c) =>
            c.name.toLowerCase() === cleanName.toLowerCase() ||
            (cleanPhone && c.phone === cleanPhone)
        );

    if (linkedCustomer) {
      if (
        cleanAddress &&
        cleanAddress.toLowerCase() !== linkedCustomer.currentAddress.trim().toLowerCase()
      ) {
        linkedCustomer.currentAddress = cleanAddress;
        linkedCustomer.addressHistory.push({
          address: cleanAddress,
          recordedAt: nowIso,
          note: 'Updated via invoice',
        });
        linkedCustomer.updatedAt = nowIso;
      }
      if (cleanPhone && !linkedCustomer.phone) {
        linkedCustomer.phone = cleanPhone;
        linkedCustomer.updatedAt = nowIso;
      }
    } else {
      linkedCustomer = {
        id: `cust-${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        currentAddress: cleanAddress,
        addressHistory: cleanAddress
          ? [
              {
                address: cleanAddress,
                recordedAt: nowIso,
                note: 'Recorded on first invoice',
              },
            ]
          : [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store.customers.unshift(linkedCustomer);
    }

    const subtotal = resolvedLines.reduce((sum, l) => sum + l.quantity * l.price, 0);
    const safeVatRate = Math.max(0, Number(vatRate) || 0);
    const vat = Math.round(subtotal * (safeVatRate / 100) * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;
    const seq = 1001 + store.invoices.length;
    const invoiceNumber = `INV-2026-${seq}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: linkedCustomer.id,
      customerName: cleanName,
      customerPhone: cleanPhone || linkedCustomer.phone || undefined,
      customerAddress: cleanAddress || linkedCustomer.currentAddress || undefined,
      items: resolvedLines,
      subtotal,
      vatRate: safeVatRate,
      vat,
      total,
      paid: Boolean(paid),
      paymentMethod: paid ? (paymentMethod as PaymentMethod) || 'cash' : undefined,
      createdAt: nowIso,
    };

    store.invoices.unshift(newInvoice);

    if (newInvoice.paid) {
      const method: PaymentMethod = (paymentMethod as PaymentMethod) || 'cash';
      const txnId =
        transactionId && String(transactionId).trim()
          ? String(transactionId).trim().toUpperCase()
          : `${method.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      store.payments.unshift({
        id: `pay-${Date.now()}`,
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        customerName: newInvoice.customerName,
        method,
        transactionId: txnId,
        amount: newInvoice.total,
        status: 'completed',
        createdAt: newInvoice.createdAt,
      });
    }

    writeStore(store);
    return res.status(201).json({ data: newInvoice });
  });

  app.delete('/api/v1/invoices/:id', (req, res) => {
    const store = readStore();
    const next = store.invoices.filter((inv) => inv.id !== req.params.id);
    if (next.length === store.invoices.length) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    store.invoices = next;
    store.payments = store.payments.filter((p) => p.invoiceId !== req.params.id);
    writeStore(store);
    return res.json({ message: 'Invoice deleted.' });
  });

  // Payment Endpoints
  app.get('/api/v1/payments', (_req, res) => {
    const store = readStore();
    res.json({ data: store.payments });
  });

  app.post('/api/v1/payments', (req, res) => {
    const { invoiceId, method, transactionId, amount } = req.body ?? {};
    if (!invoiceId || !method || !transactionId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invoice, payment method, transaction ID, and amount are required.' });
    }
    const store = readStore();
    const invoice = store.invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    const cleanTxn = String(transactionId).trim().toUpperCase();
    if (store.payments.some((p) => p.transactionId === cleanTxn)) {
      return res.status(409).json({ error: 'A payment with this Transaction ID already exists.' });
    }
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      method: method as PaymentMethod,
      transactionId: cleanTxn,
      amount: Number(amount),
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    store.payments.unshift(payment);
    invoice.paid = true;
    invoice.paymentMethod = method as PaymentMethod;
    writeStore(store);
    return res.status(201).json({ data: payment });
  });

  // Forecast Endpoint
  app.get('/api/v1/forecast', (_req, res) => {
    const store = readStore();
    res.json({ data: buildForecast(store.invoices) });
  });

  // Server-Side Gemini AI Assistant Endpoint
  app.post('/api/v1/assistant', async (req, res) => {
    const { question, locale = 'en' } = req.body ?? {};
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: 'Please enter a question for the business advisor.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    try {
      const store = readStore();
      const lowStockItems = store.items.filter((it) => it.quantity <= it.lowStockThreshold);
      const unpaidInvoices = store.invoices.filter((inv) => !inv.paid);
      const totalRevenue = store.invoices
        .filter((inv) => inv.paid)
        .reduce((sum, inv) => sum + inv.total, 0);

      const snapshot = {
        currency: 'BDT (৳)',
        totalRevenue,
        unpaidCount: unpaidInvoices.length,
        unpaidTotal: unpaidInvoices.reduce((s, i) => s + i.total, 0),
        unpaidCustomers: unpaidInvoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          customerName: i.customerName,
          total: i.total,
        })),
        lowStockItems: lowStockItems.map((i) => ({
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          threshold: i.lowStockThreshold,
          price: i.price,
        })),
        inventoryCount: store.items.length,
        recentPaymentMethods: store.payments.slice(0, 5).map((p) => ({
          method: p.method,
          amount: p.amount,
        })),
      };

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const languageRule =
        locale === 'bn'
          ? 'Respond in clear, natural Bengali (বাংলা) using ৳ for Taka amounts.'
          : 'Respond in clear, concise English using ৳ for Taka amounts.';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `STORE DATA SNAPSHOT:\n${JSON.stringify(snapshot, null, 2)}\n\nSHOP OWNER QUESTION:\n${String(question).trim()}`,
        config: {
          systemInstruction: `You are Shonchoy AI Business Advisor for a retail/wholesale business in Bangladesh. ${languageRule} Give direct, actionable recommendations grounded strictly in the store snapshot numbers (inventory levels, unpaid invoices, bKash/Nagad/Cash payments, and sales figures). Keep responses concise and practical.`,
        },
      });

      return res.json({ answer: response.text ?? '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate insights.';
      return res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Shonchoy server running on http://0.0.0.0:${port}`);
  });
}

startServer();
