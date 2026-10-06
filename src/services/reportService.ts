import { supabase } from "@/lib/supabase";
import { formatRupiah, roundPrice500 } from "@/lib/utils";

export interface DailySalesData {
  date: string;
  dayLabel: string;
  revenue: number;
  transactionsCount: number;
  itemsCount: number;
}

export interface BestSellerProduct {
  productId: string;
  name: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  profit: number;
}

export interface CategorySalesData {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  quantitySold: number;
  percentage: number;
  color: string;
}

export interface FinancialReportSummary {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  totalTransactions: number;
  averageBasketSize: number;
  totalUnitsSold: number;
  dailyTrend: DailySalesData[];
  monthlyTrend: { monthLabel: string; revenue: number }[];
  bestSellers: BestSellerProduct[];
  categoryBreakdown: CategorySalesData[];
}

const CATEGORY_COLORS = [
  "#6FA084", // Sage Green
  "#E8A838", // Amber
  "#D64545", // Crimson
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#6B7280", // Gray
  "#10B981", // Emerald
  "#EC4899", // Pink
];

export const reportService = {
  /**
   * Fetch all completed transactions and details within a date range
   */
  async getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReportSummary> {
    let query = supabase
      .from("transactions")
      .select(`
        id,
        invoice_number,
        total_amount,
        payment_method,
        status,
        created_at,
        details:transaction_details (
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          product:products (
            id,
            name,
            buy_price,
            category_id,
            category:categories (id, name)
          )
        )
      `)
      .eq("status", "Selesai")
      .order("created_at", { ascending: true });

    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }

    const { data: rawTransactions, error } = await query;
    if (error) throw error;

    const transactions = rawTransactions || [];

    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;
    const dailyMap = new Map<string, { revenue: number; txCount: number; itemsCount: number }>();
    const monthlyMap = new Map<string, number>();
    const productMap = new Map<
      string,
      { name: string; categoryName: string; quantity: number; revenue: number; profit: number }
    >();
    const categoryMap = new Map<string, { name: string; revenue: number; quantity: number }>();

    transactions.forEach((tx: any) => {
      const txRevenue = Number(tx.total_amount);
      totalRevenue += txRevenue;

      // Date parsing
      const txDate = new Date(tx.created_at);
      const dateKey = txDate.toISOString().slice(0, 10);
      const monthKey = txDate.toLocaleString("id-ID", { month: "short", year: "numeric" });

      // Daily aggregation
      const existingDaily = dailyMap.get(dateKey) || { revenue: 0, txCount: 0, itemsCount: 0 };
      existingDaily.revenue += txRevenue;
      existingDaily.txCount += 1;

      // Monthly aggregation
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + txRevenue);

      let txItemsCount = 0;

      // Details parsing
      (tx.details || []).forEach((d: any) => {
        const qty = Number(d.quantity) || 0;
        const subtotal = Number(d.subtotal) || 0;
        const buyPrice = Number(d.product?.buy_price) || 0;
        const cost = buyPrice * qty;
        const profit = subtotal - cost;

        totalCost += cost;
        totalUnitsSold += qty;
        txItemsCount += qty;

        // Product map
        if (d.product_id) {
          const prodName = d.product?.name || "Produk";
          const catName = d.product?.category?.name || "Lain-lain";
          const p = productMap.get(d.product_id) || {
            name: prodName,
            categoryName: catName,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
          p.quantity += qty;
          p.revenue += subtotal;
          p.profit += profit;
          productMap.set(d.product_id, p);

          // Category map
          const catKey = d.product?.category_id || "uncategorized";
          const c = categoryMap.get(catKey) || { name: catName, revenue: 0, quantity: 0 };
          c.revenue += subtotal;
          c.quantity += qty;
          categoryMap.set(catKey, c);
        }
      });

      existingDaily.itemsCount += txItemsCount;
      dailyMap.set(dateKey, existingDaily);
    });

    const totalTransactions = transactions.length;
    const netProfit = totalRevenue - totalCost;
    const averageBasketSize = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Convert daily map to sorted list
    const dailyTrend: DailySalesData[] = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => {
        const d = new Date(date);
        return {
          date,
          dayLabel: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          revenue: val.revenue,
          transactionsCount: val.txCount,
          itemsCount: val.itemsCount,
        };
      });

    // Monthly trend
    const monthlyTrend = Array.from(monthlyMap.entries()).map(([monthLabel, revenue]) => ({
      monthLabel,
      revenue,
    }));

    // Top Best Sellers
    const bestSellers: BestSellerProduct[] = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        categoryName: data.categoryName,
        quantitySold: data.quantity,
        totalRevenue: data.revenue,
        profit: data.profit,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 8);

    // Category breakdown
    const categoryBreakdown: CategorySalesData[] = Array.from(categoryMap.entries())
      .map(([categoryId, data], idx) => ({
        categoryId,
        categoryName: data.name,
        totalRevenue: data.revenue,
        quantitySold: data.quantity,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalRevenue,
      totalCost,
      netProfit,
      totalTransactions,
      averageBasketSize,
      totalUnitsSold,
      dailyTrend,
      monthlyTrend,
      bestSellers,
      categoryBreakdown,
    };
  },

  /**
   * Get all-time monthly historical trend spanning 2025 - 2026
   */
  async getMonthlyHistoricalTrend() {
    const { data: rawTx, error } = await supabase
      .from("transactions")
      .select("total_amount, created_at")
      .eq("status", "Selesai")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const monthlyMap = new Map<
      string,
      { year: number; month: number; label: string; revenue: number; txCount: number }
    >();

    (rawTx || []).forEach((tx) => {
      const d = new Date(tx.created_at);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });

      const existing = monthlyMap.get(key) || {
        year,
        month,
        label,
        revenue: 0,
        txCount: 0,
      };
      existing.revenue += Number(tx.total_amount);
      existing.txCount += 1;
      monthlyMap.set(key, existing);
    });

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => ({
        key,
        year: val.year,
        label: val.label,
        revenue: val.revenue,
        txCount: val.txCount,
      }));
  },

  /**
   * Generate CSV format and trigger instant browser download
   */
  exportToCsv(report: FinancialReportSummary, periodLabel: string) {
    const lines: string[] = [];

    // Header info
    lines.push("LAPORAN KEUANGAN & PENJUALAN — TOKOKU");
    lines.push(`Periode: ${periodLabel}`);
    lines.push(`Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`);
    lines.push("");

    // Ringkasan Keuangan
    lines.push("--- RINGKASAN KEUANGAN ---");
    lines.push(`Total Pendapatan (Omzet);Rp ${report.totalRevenue.toLocaleString("id-ID")}`);
    lines.push(`Total HPP (Modal Barang);Rp ${report.totalCost.toLocaleString("id-ID")}`);
    lines.push(`Total Laba Bersih;Rp ${report.netProfit.toLocaleString("id-ID")}`);
    lines.push(`Total Transaksi;${report.totalTransactions}`);
    lines.push(`Rata-rata Nilai Transaksi;Rp ${report.averageBasketSize.toLocaleString("id-ID")}`);
    lines.push(`Total Produk Terjual;${report.totalUnitsSold} pcs`);
    lines.push("");

    // Penjualan Harian
    lines.push("--- TREN PENJUALAN HARIAN ---");
    lines.push("Tanggal;Total Pendapatan;Jumlah Transaksi;Item Terjual");
    report.dailyTrend.forEach((d) => {
      lines.push(`${d.date};${d.revenue};${d.transactionsCount};${d.itemsCount}`);
    });
    lines.push("");

    // Produk Terlaris
    lines.push("--- 8 PRODUK TERLARIS (BEST SELLERS) ---");
    lines.push("Peringkat;Nama Produk;Kategori;Kuantitas Terjual;Total Omzet;Estimasi Laba");
    report.bestSellers.forEach((p, idx) => {
      lines.push(
        `${idx + 1};${p.name};${p.categoryName};${p.quantitySold};${p.totalRevenue};${p.profit}`
      );
    });
    lines.push("");

    // Penjualan per Kategori
    lines.push("--- PENDAPATAN PER KATEGORI ---");
    lines.push("Kategori;Total Omzet;Kuantitas Terjual;Porsi (%)");
    report.categoryBreakdown.forEach((c) => {
      lines.push(`${c.categoryName};${c.totalRevenue};${c.quantitySold};${c.percentage}%`);
    });

    // BOM for Indonesian Excel UTF-8 recognition
    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Laporan_Keuangan_TokoKu_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
