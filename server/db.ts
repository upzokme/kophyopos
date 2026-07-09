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
          phones: [],
          sales: [],
        };
        this.saveToDisk();
      } else {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.cache = JSON.parse(raw);
        // Ensure structure is correct
        if (!this.cache.phones) this.cache.phones = [];
        if (!this.cache.sales) this.cache.sales = [];
      }

      // Automatically seed April, May, June, July data if empty
      this.seedBurmeseMarketData();
    } catch (err) {
      console.error("Failed to initialize database:", err);
      this.cache = { phones: [], sales: [] };
    }
  }

  public clearAllData(): void {
    this.cache = {
      phones: [],
      sales: [],
    };
    this.saveToDisk();
  }

  private seedBurmeseMarketData() {
    // If we already have phones, don't auto-seed on start so we don't duplicate or overwrite
    if (this.cache.phones.length > 0) {
      return;
    }

    console.log("Seeding Burmese Market Data for April, May, June, and July...");

    const phoneModels = [
      { brand: "Apple", model: "iPhone 15 Pro Max", color: "Natural Titanium", ram: "8GB", storage: "256GB", buyPrice: 4500000, sellPrice: 5100000 },
      { brand: "Apple", model: "iPhone 15 Pro", color: "Blue Titanium", ram: "8GB", storage: "256GB", buyPrice: 4000000, sellPrice: 4550000 },
      { brand: "Apple", model: "iPhone 15", color: "Black", ram: "6GB", storage: "128GB", buyPrice: 3200000, sellPrice: 3650000 },
      { brand: "Apple", model: "iPhone 14 Pro Max", color: "Deep Purple", ram: "6GB", storage: "256GB", buyPrice: 3500000, sellPrice: 4000000 },
      { brand: "Samsung", model: "Galaxy S24 Ultra", color: "Titanium Gray", ram: "12GB", storage: "512GB", buyPrice: 4800000, sellPrice: 5400000 },
      { brand: "Samsung", model: "Galaxy S24+", color: "Onyx Black", ram: "12GB", storage: "256GB", buyPrice: 3600000, sellPrice: 4100000 },
      { brand: "Samsung", model: "Galaxy A55", color: "Awesome Iceblue", ram: "8GB", storage: "128GB", buyPrice: 1500000, sellPrice: 1750000 },
      { brand: "Xiaomi", model: "Redmi Note 13 Pro", color: "Ocean Teal", ram: "8GB", storage: "256GB", buyPrice: 950000, sellPrice: 1150000 },
      { brand: "Oppo", model: "Reno 11 Pro", color: "Pearl White", ram: "12GB", storage: "512GB", buyPrice: 1600000, sellPrice: 1850000 },
      { brand: "Vivo", model: "V30", color: "Peacock Green", ram: "12GB", storage: "256GB", buyPrice: 1400000, sellPrice: 1620000 },
    ];

    const customerNames = [
      "Ko Min Khant", "Ma Honey Htun", "Ko Kyaw Zin Latt", "Ma Yoon Thiri", "Ko Aung Myo Thu",
      "Ma Su Myat Sandar", "Ko Myo Min Oo", "Ma Khin Thida", "Ko Zin Ko Htet", "Ma Ei Phyu",
      "Ko Phyo Wai Aung", "Ma May Thu", "U Kyaw Kyaw", "Daw Nu Nu", "Ko Sai Lu", "Ma Nan Shwe"
    ];

    const targetYear = 2026;

    // April (3): 10 phones, 5 sold, 5 available
    // May (4): 10 phones, 5 sold, 5 available
    // June (5): 10 phones, 5 sold, 5 available
    // July (6): 5 phones, 3 sold, 2 available
    const config = [
      { month: 3, totalPhones: 10, soldPhones: 5, days: 30 },
      { month: 4, totalPhones: 10, soldPhones: 5, days: 31 },
      { month: 5, totalPhones: 10, soldPhones: 5, days: 30 },
      { month: 6, totalPhones: 5, soldPhones: 3, days: 31 },
    ];

    config.forEach(({ month, totalPhones, soldPhones, days }) => {
      for (let i = 1; i <= totalPhones; i++) {
        const templateIdx = (month * 17 + i) % phoneModels.length;
        const temp = phoneModels[templateIdx];
        const custIdx = (month * 11 + i) % customerNames.length;

        const imei = `358912${month}${String(i).padStart(3, "0")}${100000 + Math.floor(Math.random() * 900000)}`;
        const isSold = i <= soldPhones;
        const status = isSold ? PhoneStatus.Sold : PhoneStatus.Available;

        // Distribute dates across the month
        const day = Math.floor(((i - 1) * days) / totalPhones) + 1;
        const hour = 10 + (i % 8);
        const minute = (i * 13) % 60;
        const dateStr = new Date(targetYear, month, day, hour, minute, 0).toISOString();

        const phoneId = `p_seeded_${month}_${i}`;

        const newPhone: Phone = {
          id: phoneId,
          brand: temp.brand,
          model: temp.model,
          color: temp.color,
          ram: temp.ram,
          storage: temp.storage,
          imei: imei,
          buyPrice: temp.buyPrice,
          sellPrice: temp.sellPrice,
          status: status,
          createdAt: dateStr,
        };

        this.cache.phones.push(newPhone);

        if (isSold) {
          const saleId = `s_seeded_${month}_${i}`;
          const newSale: Sale = {
            id: saleId,
            phoneId: phoneId,
            customerName: customerNames[custIdx],
            sellingPrice: temp.sellPrice,
            profit: temp.sellPrice - temp.buyPrice,
            saleDate: dateStr,
          };
          this.cache.sales.push(newSale);
        }
      }
    });

    this.saveToDisk();
    console.log("Successfully seeded Burmese market phone database for April, May, June, July 2026!");
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

  public sellPhone(phoneId: string, payload: { 
    customerName?: string; 
    customerPhone?: string;
    customerAddress?: string;
    hasCover?: boolean;
    hasScreenProtector?: boolean;
    hasCharger?: boolean;
    sellingPrice: number; 
    saleDate?: string; 
  }): { sale: Sale; phone: Phone } {
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
      customerPhone: payload.customerPhone || undefined,
      customerAddress: payload.customerAddress || undefined,
      hasCover: !!payload.hasCover,
      hasScreenProtector: !!payload.hasScreenProtector,
      hasCharger: !!payload.hasCharger,
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

    const currentStockValue = this.cache.phones
      .filter((p) => p.status === PhoneStatus.Available)
      .reduce((sum, p) => sum + p.buyPrice, 0);

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
      currentStockValue,
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
