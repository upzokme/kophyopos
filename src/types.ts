/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PhoneStatus {
  Available = "Available",
  Sold = "Sold",
}

export interface Phone {
  id: string;
  brand: string;
  model: string;
  color: string;
  ram: string;      // e.g., "8GB"
  storage: string;  // e.g., "128GB"
  imei: string;     // Unique
  buyPrice: number; // Must be >= 0
  sellPrice: number;// Must be >= 0
  status: PhoneStatus;
  createdAt: string; // ISO date string
}

export interface Sale {
  id: string;
  phoneId: string;
  customerName?: string;
  sellingPrice: number; // Must be >= 0
  profit: number;       // sellingPrice - buyPrice
  saleDate: string;     // ISO date string
}

export interface DashboardStats {
  totalPhones: number;
  availablePhones: number;
  soldPhones: number;
  todaySales: number;       // total revenue of today's sales
  thisMonthSales: number;   // total revenue of this month's sales
  thisMonthProfit: number;  // total profit of this month's sales
}

export interface MonthlyReport {
  phonesSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  currentStockValue: number; // Sum of buyPrice of available phones
  month: number;             // 1-12
  year: number;              // e.g., 2026
}

export interface BrandModelColorOptions {
  brands: string[];
  models: string[];
  colors: string[];
}
