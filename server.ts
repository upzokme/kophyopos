/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Standard middleware
  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. GET all phones
  app.get("/api/phones", async (req, res) => {
    try {
      const phones = await db.getPhones();
      res.json(phones);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch phones" });
    }
  });

  // 2. GET brand/model/color options for filters
  app.get("/api/phones/options", async (req, res) => {
    try {
      const phones = await db.getPhones();
      const brands = Array.from(new Set(phones.map((p) => p.brand))).filter(Boolean).sort();
      const models = Array.from(new Set(phones.map((p) => p.model))).filter(Boolean).sort();
      const colors = Array.from(new Set(phones.map((p) => p.color))).filter(Boolean).sort();
      res.json({ brands, models, colors });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch filtering options" });
    }
  });

  // 3. POST add a phone
  app.post("/api/phones", async (req, res) => {
    try {
      const { brand, model, color, ram, storage, imei, buyPrice, sellPrice, createdAt } = req.body;
      const parsedBuyPrice = parseFloat(buyPrice);
      const parsedSellPrice = parseFloat(sellPrice);

      const newPhone = await db.addPhone({
        brand: brand?.trim() || "",
        model: model?.trim() || "",
        color: color?.trim() || "",
        ram: ram?.trim() || "",
        storage: storage?.trim() || "",
        imei: imei?.trim() || "",
        buyPrice: isNaN(parsedBuyPrice) ? 0 : parsedBuyPrice,
        sellPrice: isNaN(parsedSellPrice) ? 0 : parsedSellPrice,
        createdAt: createdAt || undefined,
      });

      res.status(201).json(newPhone);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to add phone" });
    }
  });

  // 4. PUT update a phone
  app.put("/api/phones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { brand, model, color, ram, storage, imei, buyPrice, sellPrice, createdAt } = req.body;
      const parsedBuyPrice = buyPrice !== undefined ? parseFloat(buyPrice) : undefined;
      const parsedSellPrice = sellPrice !== undefined ? parseFloat(sellPrice) : undefined;

      const updatedPhone = await db.updatePhone(id, {
        brand: brand !== undefined ? brand.trim() : undefined,
        model: model !== undefined ? model.trim() : undefined,
        color: color !== undefined ? color.trim() : undefined,
        ram: ram !== undefined ? ram.trim() : undefined,
        storage: storage !== undefined ? storage.trim() : undefined,
        imei: imei !== undefined ? imei.trim() : undefined,
        buyPrice: parsedBuyPrice,
        sellPrice: parsedSellPrice,
        createdAt: createdAt || undefined,
      });

      res.json(updatedPhone);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update phone" });
    }
  });

  // 5. DELETE a phone
  app.delete("/api/phones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.deletePhone(id);
      res.json({ success: true, message: "Phone deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete phone" });
    }
  });

  // 6. GET all sales (with joined phone details)
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await db.getSales();
      const phones = await db.getPhones();
      const phoneMap = new Map(phones.map((p) => [p.id, p]));

      const salesWithPhones = sales.map((sale) => {
        const phone = phoneMap.get(sale.phoneId);
        return {
          ...sale,
          brand: phone?.brand || "Unknown",
          model: phone?.model || "Unknown",
          color: phone?.color || "Unknown",
          imei: phone?.imei || "Unknown",
          buyPrice: phone?.buyPrice || 0,
        };
      });

      res.json(salesWithPhones);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch sales" });
    }
  });

  // 7. POST create a sale (sell a phone)
  app.post("/api/sales", async (req, res) => {
    try {
      const { phoneId, customerName, customerPhone, customerAddress, hasCover, hasScreenProtector, hasCharger, sellingPrice, saleDate } = req.body;
      const parsedSellingPrice = parseFloat(sellingPrice);

      if (isNaN(parsedSellingPrice)) {
        return res.status(400).json({ error: "Selling price must be a valid number" });
      }

      const result = await db.sellPhone(phoneId, {
        customerName: customerName?.trim() || undefined,
        customerPhone: customerPhone?.trim() || undefined,
        customerAddress: customerAddress?.trim() || undefined,
        hasCover: !!hasCover,
        hasScreenProtector: !!hasScreenProtector,
        hasCharger: !!hasCharger,
        sellingPrice: parsedSellingPrice,
        saleDate,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to complete sale" });
    }
  });

  // DELETE a sale (reverts phone to available stock)
  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.deleteSale(id);
      res.json({ success: true, message: "Sale deleted and phone returned to stock successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to cancel sale transaction" });
    }
  });

  // 8. GET dashboard statistics
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await db.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch dashboard stats" });
    }
  });

  // 9. GET monthly report
  app.get("/api/reports", async (req, res) => {
    try {
      const now = new Date();
      const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

      if (isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Month must be between 1 and 12" });
      }
      if (isNaN(year) || year < 1000) {
        return res.status(400).json({ error: "Year must be a valid 4-digit number" });
      }

      const report = await db.getMonthlyReport(month, year);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch report" });
    }
  });

  // 10. POST clear all database data (reset)
  app.post("/api/reset", async (req, res) => {
    try {
      await db.clearAllData();
      res.json({ success: true, message: "Database wiped and reset successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reset database" });
    }
  });


  // --- VITE DEV OR STATIC PROD SERVING ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
