/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { Phone, Sale, PhoneStatus, DashboardStats, MonthlyReport } from "../src/types.js";

// Database file path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

interface DatabaseSchema {
  phones: Phone[];
  sales: Sale[];
}

// Initial seed data if DB is empty
const SEED_PHONES: Phone[] = [
  {
    id: "p1",
    brand: "Apple",
    model: "iPhone 15 Pro",
    color: "Titanium Gray",
    ram: "8GB",
    storage: "256GB",
    imei: "358912345678901",
    buyPrice: 850,
    sellPrice: 1099,
    status: PhoneStatus.Available,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
  {
    id: "p2",
    brand: "Apple",
    model: "iPhone 14",
    color: "Midnight Blue",
    ram: "6GB",
    storage: "128GB",
    imei: "358912345678902",
    buyPrice: 600,
    sellPrice: 799,
    status: PhoneStatus.Sold,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    id: "p3",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    color: "Titanium Black",
    ram: "12GB",
    storage: "512GB",
    imei: "358912345678903",
    buyPrice: 950,
    sellPrice: 1299,
    status: PhoneStatus.Available,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: "p4",
    brand: "Samsung",
    model: "Galaxy A54",
    color: "Awesome Violet",
    ram: "8GB",
    storage: "128GB",
    imei: "358912345678904",
    buyPrice: 250,
    sellPrice: 399,
    status: PhoneStatus.Sold,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "p5",
    brand: "Google",
    model: "Pixel 8 Pro",
    color: "Bay Blue",
    ram: "12GB",
    storage: "128GB",
    imei: "358912345678905",
    buyPrice: 700,
    sellPrice: 999,
    status: PhoneStatus.Available,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    id: "p6",
    brand: "Xiaomi",
    model: "Redmi Note 13 Pro",
    color: "Ocean Teal",
    ram: "8GB",
    storage: "256GB",
    imei: "358912345678906",
    buyPrice: 180,
    sellPrice: 299,
    status: PhoneStatus.Available,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

const SEED_SALES: Sale[] = [
  {
    id: "s1",
    phoneId: "p2",
    customerName: "Alice Smith",
    sellingPrice: 780,
    profit: 180, // 780 - 600
    saleDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
  },
  {
    id: "s2",
    phoneId: "p4",
    customerName: "Bob Jones",
    sellingPrice: 380,
    profit: 130, // 380 - 250
    saleDate: new Date().toISOString(), // Today
  },
];

class DatabaseManager {
  private cache: DatabaseSchema = { phones: [], sales: [] };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        this.cache = {
          phones: SEED_PHONES,
          sales: SEED_SALES,
        };
        this.saveToDisk();
      } else {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.cache = JSON.parse(raw);
        // Ensure structure is correct
        if (!this.cache.phones) this.cache.phones = [];
        if (!this.cache.sales) this.cache.sales = [];
      }
    } catch (err) {
      console.error("Failed to initialize database:", err);
      this.cache = { phones: SEED_PHONES, sales: SEED_SALES };
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save database to disk:", err);
    }
  }

  // Generate unique ID
  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // --- PHONES ---

  public getPhones(): Phone[] {
    return [...this.cache.phones];
  }

  public getPhone(id: string): Phone | undefined {
    return this.cache.phones.find((p) => p.id === id);
  }

  public addPhone(phone: Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }): Phone {
    // Validations
    if (!phone.brand || !phone.model || !phone.imei) {
      throw new Error("Brand, Model, and IMEI are required");
    }

    if (phone.buyPrice < 0) {
      throw new Error("Buy price cannot be negative");
    }

    if (phone.sellPrice < 0) {
      throw new Error("Sell price cannot be negative");
    }

    // Uniqueness check for IMEI
    const imeiExists = this.cache.phones.some((p) => p.imei === phone.imei);
    if (imeiExists) {
      throw new Error(`IMEI ${phone.imei} is already registered to another phone.`);
    }

    const newPhone: Phone = {
      brand: phone.brand,
      model: phone.model,
      color: phone.color,
      ram: phone.ram,
      storage: phone.storage,
      imei: phone.imei,
      buyPrice: phone.buyPrice,
      sellPrice: phone.sellPrice,
      id: this.generateId("phone"),
      status: PhoneStatus.Available,
      createdAt: phone.createdAt ? new Date(phone.createdAt).toISOString() : new Date().toISOString(),
    };

    this.cache.phones.unshift(newPhone); // Newest first
    this.saveToDisk();
    return newPhone;
  }

  public updatePhone(id: string, updatedFields: Partial<Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }>): Phone {
    const index = this.cache.phones.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Phone not found");
    }

    const existing = this.cache.phones[index];

    // Check unique IMEI if changed
    if (updatedFields.imei && updatedFields.imei !== existing.imei) {
      const imeiExists = this.cache.phones.some((p) => p.imei === updatedFields.imei && p.id !== id);
      if (imeiExists) {
        throw new Error(`IMEI ${updatedFields.imei} is already registered to another phone.`);
      }
    }

    if (updatedFields.buyPrice !== undefined && updatedFields.buyPrice < 0) {
      throw new Error("Buy price cannot be negative");
    }

    if (updatedFields.sellPrice !== undefined && updatedFields.sellPrice < 0) {
      throw new Error("Sell price cannot be negative");
    }

    const updatedPhone: Phone = {
      ...existing,
      ...updatedFields,
      createdAt: updatedFields.createdAt ? new Date(updatedFields.createdAt).toISOString() : existing.createdAt,
    };

    this.cache.phones[index] = updatedPhone;
    this.saveToDisk();
    return updatedPhone;
  }

  public deletePhone(id: string): void {
    const index = this.cache.phones.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Phone not found");
    }

    const phone = this.cache.phones[index];
    if (phone.status === PhoneStatus.Sold) {
      throw new Error("Cannot delete Sold phones");
    }

    this.cache.phones.splice(index, 1);
    this.saveToDisk();
  }

  // --- SALES ---

  public getSales(): Sale[] {
    return [...this.cache.sales];
  }

  public sellPhone(phoneId: string, payload: { customerName?: string; sellingPrice: number; saleDate?: string }): { sale: Sale; phone: Phone } {
    const phoneIndex = this.cache.phones.findIndex((p) => p.id === phoneId);
    if (phoneIndex === -1) {
      throw new Error("Phone not found");
    }

    const phone = this.cache.phones[phoneIndex];
    if (phone.status === PhoneStatus.Sold) {
      throw new Error("Cannot sell a phone already marked Sold");
    }

    if (payload.sellingPrice < 0) {
      throw new Error("Selling price cannot be negative");
    }

    // Calculate profit
    const profit = payload.sellingPrice - phone.buyPrice;

    // Create Sale record
    const saleDate = payload.saleDate ? new Date(payload.saleDate).toISOString() : new Date().toISOString();
    const newSale: Sale = {
      id: this.generateId("sale"),
      phoneId,
      customerName: payload.customerName || undefined,
      sellingPrice: payload.sellingPrice,
      profit,
      saleDate,
    };

    // Update phone status
    phone.status = PhoneStatus.Sold;
    this.cache.phones[phoneIndex] = phone;

    // Save sale
    this.cache.sales.unshift(newSale);
    this.saveToDisk();

    return { sale: newSale, phone };
  }

  public deleteSale(saleId: string): void {
    const saleIndex = this.cache.sales.findIndex((s) => s.id === saleId);
    if (saleIndex === -1) {
      throw new Error("Sale record not found");
    }

    const sale = this.cache.sales[saleIndex];
    const phoneId = sale.phoneId;

    // Find the phone and revert its status to Available
    const phoneIndex = this.cache.phones.findIndex((p) => p.id === phoneId);
    if (phoneIndex !== -1) {
      this.cache.phones[phoneIndex].status = PhoneStatus.Available;
    }

    // Delete the sale record
    this.cache.sales.splice(saleIndex, 1);
    this.saveToDisk();
  }

  // --- DASHBOARD ---

  public getDashboardStats(): DashboardStats {
    const totalPhones = this.cache.phones.length;
    const availablePhones = this.cache.phones.filter((p) => p.status === PhoneStatus.Available).length;
    const soldPhones = this.cache.phones.filter((p) => p.status === PhoneStatus.Sold).length;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const thisMonth = now.getMonth(); // 0-11
    const thisYear = now.getFullYear();

    let todaySales = 0;
    let thisMonthSales = 0;
    let thisMonthProfit = 0;

    this.cache.sales.forEach((s) => {
      const saleDate = new Date(s.saleDate);
      const saleDateStr = s.saleDate.split("T")[0];

      // Today's Sales
      if (saleDateStr === todayStr) {
        todaySales += s.sellingPrice;
      }

      // This Month's Sales & Profit
      if (saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear) {
        thisMonthSales += s.sellingPrice;
        thisMonthProfit += s.profit;
      }
    });

    return {
      totalPhones,
      availablePhones,
      soldPhones,
      todaySales,
      thisMonthSales,
      thisMonthProfit,
    };
  }

  // --- REPORTS ---

  public getMonthlyReport(month: number, year: number): MonthlyReport {
    let phonesSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    // We need to calculate total Cost (sum of buyPrice of sold phones in that month)
    // Map phone IDs to easily look up their buyPrice
    const phoneMap = new Map<string, Phone>();
    this.cache.phones.forEach((p) => phoneMap.set(p.id, p));

    this.cache.sales.forEach((s) => {
      const saleDate = new Date(s.saleDate);
      if (saleDate.getMonth() + 1 === month && saleDate.getFullYear() === year) {
        phonesSold++;
        totalRevenue += s.sellingPrice;
        totalProfit += s.profit;

        const phone = phoneMap.get(s.phoneId);
        if (phone) {
          totalCost += phone.buyPrice;
        }
      }
    });

    // Current Stock Value is the sum of buyPrice of ALL currently Available phones
    // (regardless of when they were added)
    const currentStockValue = this.cache.phones
      .filter((p) => p.status === PhoneStatus.Available)
      .reduce((sum, p) => sum + p.buyPrice, 0);

    return {
      phonesSold,
      totalRevenue,
      totalCost,
      totalProfit,
      currentStockValue,
      month,
      year,
    };
  }
}

export const db = new DatabaseManager();
