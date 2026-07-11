/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { Phone, Sale, PhoneStatus, DashboardStats, MonthlyReport } from "../src/types.js";

// Database file path for local fallback backup
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

interface DatabaseSchema {
  phones: Phone[];
  sales: Sale[];
}

// Read Firebase Config from firebase-applet-config.json with environment variable fallbacks
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let config: any = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (e) {
    console.warn("Failed to parse firebase-applet-config.json, using environment fallback if available:", e);
  }
}

const firebaseConfig = {
  apiKey: config.apiKey || process.env.FIREBASE_API_KEY,
  authDomain: config.authDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.appId || process.env.FIREBASE_APP_ID
};

const dbId = config.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID;

// Initialize Firebase App and Firestore database
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(firebaseApp, {}, dbId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanForFirestore<T extends object>(obj: T): any {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

class DatabaseManager {
  private cache: DatabaseSchema = { phones: [], sales: [] };
  private initializedPromise: Promise<void>;

  constructor() {
    this.initializedPromise = this.init();
  }

  private async init() {
    try {
      // 1. Ensure the local data directory exists for backup
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // 2. Load local cache as backup first so we can serve immediately
      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, "utf-8");
          this.cache = JSON.parse(raw);
        } catch (e) {
          console.error("Failed to parse local backup file:", e);
        }
      }

      if (!this.cache.phones) this.cache.phones = [];
      if (!this.cache.sales) this.cache.sales = [];

      // 3. Connect and retrieve latest cloud data from Firestore to sync
      console.log("Connecting to Firestore and fetching data...");
      
      let phonesSnapshot;
      try {
        phonesSnapshot = await getDocs(collection(firestoreDb, "phones"));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "phones");
        return;
      }

      let salesSnapshot;
      try {
        salesSnapshot = await getDocs(collection(firestoreDb, "sales"));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "sales");
        return;
      }

      const firestorePhones: Phone[] = [];
      phonesSnapshot.forEach((d) => {
        firestorePhones.push(d.data() as Phone);
      });

      const firestoreSales: Sale[] = [];
      salesSnapshot.forEach((d) => {
        firestoreSales.push(d.data() as Sale);
      });

      if (firestorePhones.length > 0 || firestoreSales.length > 0) {
        console.log("Loaded data successfully from Cloud Firestore!");
        // Sync cache with Cloud database content
        this.cache.phones = firestorePhones.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.cache.sales = firestoreSales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        this.saveToDisk(); // Update local backup file
      } else {
        // Firestore is empty! Seed with initial database templates and sync to Cloud
        console.log("Cloud Firestore is empty! Seeding and migrating data to Cloud Firestore...");
        this.seedBurmeseMarketData();

        const batch = writeBatch(firestoreDb);
        this.cache.phones.forEach((phone) => {
          const phoneRef = doc(firestoreDb, "phones", phone.id);
          batch.set(phoneRef, cleanForFirestore(phone));
        });

        this.cache.sales.forEach((sale) => {
          const saleRef = doc(firestoreDb, "sales", sale.id);
          batch.set(saleRef, cleanForFirestore(sale));
        });

        try {
          await batch.commit();
          console.log("Seed data successfully uploaded to Cloud Firestore!");
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, "batch_migration");
        }
      }
    } catch (err) {
      console.error("Failed to sync with Firestore, running on local database fallback:", err);
    }
  }

  public async clearAllData(): Promise<void> {
    await this.initializedPromise;
    this.cache = {
      phones: [],
      sales: [],
    };
    this.saveToDisk();

    // Delete all documents in Firestore
    try {
      const batch = writeBatch(firestoreDb);
      
      let phonesSnapshot = await getDocs(collection(firestoreDb, "phones"));
      let salesSnapshot = await getDocs(collection(firestoreDb, "sales"));

      phonesSnapshot.forEach((d) => {
        const phoneRef = doc(firestoreDb, "phones", d.id);
        batch.delete(phoneRef);
      });

      salesSnapshot.forEach((d) => {
        const saleRef = doc(firestoreDb, "sales", d.id);
        batch.delete(saleRef);
      });

      await batch.commit();
      console.log("Successfully wiped Firestore cloud data");
    } catch (err) {
      console.error("Failed to wipe Firestore:", err);
    }
  }

  private seedBurmeseMarketData() {
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
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save database backup to disk:", err);
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // --- PHONES ---

  public async getPhones(): Promise<Phone[]> {
    await this.initializedPromise;
    return [...this.cache.phones];
  }

  public async getPhone(id: string): Promise<Phone | undefined> {
    await this.initializedPromise;
    return this.cache.phones.find((p) => p.id === id);
  }

  public async addPhone(phone: Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }): Promise<Phone> {
    await this.initializedPromise;

    if (!phone.brand || !phone.model || !phone.imei) {
      throw new Error("Brand, Model, and IMEI are required");
    }

    if (phone.buyPrice < 0) {
      throw new Error("Buy price cannot be negative");
    }

    if (phone.sellPrice < 0) {
      throw new Error("Sell price cannot be negative");
    }

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

    this.cache.phones.unshift(newPhone);
    this.saveToDisk();

    // Sync to Cloud Firestore
    try {
      const phoneRef = doc(firestoreDb, "phones", newPhone.id);
      await setDoc(phoneRef, cleanForFirestore(newPhone));
    } catch (err) {
      console.error("Failed to save new phone to Firestore:", err);
      // We still return newPhone because it's saved locally
    }

    return newPhone;
  }

  public async updatePhone(id: string, updatedFields: Partial<Omit<Phone, "id" | "status" | "createdAt"> & { createdAt?: string }>): Promise<Phone> {
    await this.initializedPromise;

    const index = this.cache.phones.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Phone not found");
    }

    const existing = this.cache.phones[index];

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

    // Clean updatedFields by removing undefined values to prevent overwriting existing properties
    const cleanFields = Object.fromEntries(
      Object.entries(updatedFields).filter(([_, v]) => v !== undefined)
    );

    const updatedPhone: Phone = {
      ...existing,
      ...cleanFields,
      createdAt: updatedFields.createdAt ? new Date(updatedFields.createdAt).toISOString() : existing.createdAt,
    };

    this.cache.phones[index] = updatedPhone;
    this.saveToDisk();

    // Sync to Cloud Firestore
    try {
      const phoneRef = doc(firestoreDb, "phones", id);
      await setDoc(phoneRef, cleanForFirestore(updatedPhone));
    } catch (err) {
      console.error("Failed to update phone in Firestore:", err);
    }

    return updatedPhone;
  }

  public async deletePhone(id: string): Promise<void> {
    await this.initializedPromise;

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

    // Sync to Cloud Firestore
    try {
      const phoneRef = doc(firestoreDb, "phones", id);
      await deleteDoc(phoneRef);
    } catch (err) {
      console.error("Failed to delete phone from Firestore:", err);
    }
  }

  // --- SALES ---

  public async getSales(): Promise<Sale[]> {
    await this.initializedPromise;
    return [...this.cache.sales];
  }

  public async sellPhone(phoneId: string, payload: { 
    customerName?: string; 
    customerPhone?: string;
    customerAddress?: string;
    hasCover?: boolean;
    hasScreenProtector?: boolean;
    hasCharger?: boolean;
    sellingPrice: number; 
    saleDate?: string; 
  }): Promise<{ sale: Sale; phone: Phone }> {
    await this.initializedPromise;

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

    const profit = payload.sellingPrice - phone.buyPrice;
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

    phone.status = PhoneStatus.Sold;
    this.cache.phones[phoneIndex] = phone;

    this.cache.sales.unshift(newSale);
    this.saveToDisk();

    // Sync to Cloud Firestore (Atomic Batch)
    try {
      const batch = writeBatch(firestoreDb);
      const saleRef = doc(firestoreDb, "sales", newSale.id);
      const phoneRef = doc(firestoreDb, "phones", phoneId);
      batch.set(saleRef, cleanForFirestore(newSale));
      batch.set(phoneRef, cleanForFirestore(phone));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "sales/" + newSale.id);
    }

    return { sale: newSale, phone };
  }

  public async deleteSale(saleId: string): Promise<void> {
    await this.initializedPromise;

    const saleIndex = this.cache.sales.findIndex((s) => s.id === saleId);
    if (saleIndex === -1) {
      throw new Error("Sale record not found");
    }

    const sale = this.cache.sales[saleIndex];
    const phoneId = sale.phoneId;

    const phoneIndex = this.cache.phones.findIndex((p) => p.id === phoneId);
    if (phoneIndex !== -1) {
      this.cache.phones[phoneIndex].status = PhoneStatus.Available;
    }

    this.cache.sales.splice(saleIndex, 1);
    this.saveToDisk();

    // Sync to Cloud Firestore (Atomic Batch)
    try {
      const batch = writeBatch(firestoreDb);
      const saleRef = doc(firestoreDb, "sales", saleId);
      batch.delete(saleRef);
      if (phoneIndex !== -1) {
        const phoneRef = doc(firestoreDb, "phones", phoneId);
        batch.set(phoneRef, cleanForFirestore(this.cache.phones[phoneIndex]));
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "sales/" + saleId);
    }
  }

  // --- DASHBOARD ---

  public async getDashboardStats(): Promise<DashboardStats> {
    await this.initializedPromise;

    const totalPhones = this.cache.phones.length;
    const availablePhones = this.cache.phones.filter((p) => p.status === PhoneStatus.Available).length;
    const soldPhones = this.cache.phones.filter((p) => p.status === PhoneStatus.Sold).length;

    const currentStockValue = this.cache.phones
      .filter((p) => p.status === PhoneStatus.Available)
      .reduce((sum, p) => sum + p.buyPrice, 0);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let todaySales = 0;
    let thisMonthSales = 0;
    let thisMonthProfit = 0;

    this.cache.sales.forEach((s) => {
      const saleDate = new Date(s.saleDate);
      const saleDateStr = s.saleDate.split("T")[0];

      if (saleDateStr === todayStr) {
        todaySales += s.sellingPrice;
      }

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

  public async getMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
    await this.initializedPromise;

    let phonesSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

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
