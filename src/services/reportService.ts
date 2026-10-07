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

  /**
   * Generate beautifully formatted native Excel Workbook (.xlsx)
   * with professional classic blue table styling, accounting formats, and auto-fit columns.
   */
  async exportToExcel(report: FinancialReportSummary, periodLabel: string) {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TokoKu POS & Inventory";
    workbook.lastModifiedBy = "TokoKu System";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Laporan Keuangan", {
      views: [{ showGridLines: true }],
    });

    // Style constants - Classic Excel Blue Theme
    const PRIMARY_BLUE = "FF2F5597"; // Header blue
    const DARK_NAVY = "FF1F4E78";    // Section title
    const ICE_BLUE = "FFDDEBF7";     // Highlight / Subheader
    const ZEBRA_ROW = "FFF2F4F8";    // Alternating light blue row
    const BORDER_GRAY = "FFD9D9D9";

    const thinBorder = {
      top: { style: "thin" as const, color: { argb: BORDER_GRAY } },
      left: { style: "thin" as const, color: { argb: BORDER_GRAY } },
      bottom: { style: "thin" as const, color: { argb: BORDER_GRAY } },
      right: { style: "thin" as const, color: { argb: BORDER_GRAY } },
    };

    const headerBorder = {
      top: { style: "thin" as const, color: { argb: PRIMARY_BLUE } },
      left: { style: "thin" as const, color: { argb: PRIMARY_BLUE } },
      bottom: { style: "medium" as const, color: { argb: PRIMARY_BLUE } },
      right: { style: "thin" as const, color: { argb: PRIMARY_BLUE } },
    };

    const totalBorder = {
      top: { style: "thin" as const, color: { argb: PRIMARY_BLUE } },
      left: { style: "thin" as const, color: { argb: PRIMARY_BLUE } },
      bottom: { style: "double" as const, color: { argb: PRIMARY_BLUE } },
      right: { style: "thin" as const, color: { argb: PRIMARY_BLUE } },
    };

    // 1. Title Banner
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "TOKOKU POS & INVENTORY — LAPORAN KEUANGAN RESMI";
    titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: DARK_NAVY } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    sheet.getRow(1).height = 25;

    sheet.mergeCells("A2:G2");
    const subCell = sheet.getCell("A2");
    subCell.value = "Toko Grosir Sumber Rejeki • Pasar Induk Kramat Jati Blok A5";
    subCell.font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF595959" } };
    sheet.getRow(2).height = 18;

    sheet.mergeCells("A3:G3");
    const metaCell = sheet.getCell("A3");
    metaCell.value = `Periode: ${periodLabel}   |   Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB   |   Status: Data Terverifikasi`;
    metaCell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FF333333" } };
    sheet.getRow(3).height = 20;

    // 2. Section: RINGKASAN EKSEKUTIF (KPI)
    sheet.getCell("A5").value = "1. RINGKASAN EKSEKUTIF (KEY FINANCIAL METRICS)";
    sheet.getCell("A5").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: DARK_NAVY } };

    // KPI Table Header: Merge A6:C6 (Metrik), D6 (Nilai), E6:G6 (Keterangan) to align with 7-column layout
    sheet.mergeCells("A6:C6");
    sheet.getCell("A6").value = "Metrik Finansial";
    sheet.getCell("D6").value = "Nilai Tercatat";
    sheet.mergeCells("E6:G6");
    sheet.getCell("E6").value = "Keterangan Operasional";

    sheet.getRow(6).height = 22;
    ["A6", "B6", "C6", "D6", "E6", "F6", "G6"].forEach((ref) => {
      const c = sheet.getCell(ref);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BLUE } };
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      c.border = headerBorder;
      c.alignment = {
        vertical: "middle",
        horizontal: ["A6", "B6", "C6"].includes(ref) ? "left" : ref === "D6" ? "right" : "left",
      };
    });

    const profitMargin = report.totalRevenue > 0
      ? Math.round((report.netProfit / report.totalRevenue) * 100)
      : 0;

    const kpiData = [
      { metric: "Total Pendapatan (Omzet Kotor)", val: report.totalRevenue, format: '"Rp"#,##0', note: "Akumulasi seluruh transaksi selesai" },
      { metric: "Total Beban Pokok (HPP Modal Barang)", val: report.totalCost, format: '"Rp"#,##0', note: "Modal dasar stok produk terjual" },
      { metric: "Estimasi Laba Bersih (Gross Profit)", val: report.netProfit, format: '"Rp"#,##0', note: "Omzet dikurangi modal barang", bold: true, highlight: true },
      { metric: "Margin Keuntungan Bersih (%)", val: `${profitMargin}%`, note: "Rasio laba terhadap omzet" },
      { metric: "Total Transaksi Selesai", val: report.totalTransactions, format: "#,##0", note: "Jumlah nota/invoice terbit" },
      { metric: "Rata-rata Nilai per Transaksi (Basket Size)", val: report.averageBasketSize, format: '"Rp"#,##0', note: "Rata-rata belanja per struk" },
      { metric: "Total Volume Produk Terjual", val: report.totalUnitsSold, format: '#,##0" pcs"', note: "Total seluruh kuantitas item keluar" },
    ];

    let currentRow = 7;
    kpiData.forEach((item, idx) => {
      sheet.mergeCells(`A${currentRow}:C${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = item.metric;

      const cVal = sheet.getCell(`D${currentRow}`);
      cVal.value = item.val;

      sheet.mergeCells(`E${currentRow}:G${currentRow}`);
      sheet.getCell(`E${currentRow}`).value = item.note;

      const bg = item.highlight ? ICE_BLUE : idx % 2 === 1 ? ZEBRA_ROW : "FFFFFFFF";

      ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
        const c = sheet.getCell(`${col}${currentRow}`);
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        c.border = thinBorder;
        c.font = { name: "Segoe UI", size: 9.5, bold: !!item.bold, color: { argb: "FF1A1A1A" } };
        c.alignment = {
          vertical: "middle",
          horizontal: ["A", "B", "C"].includes(col) ? "left" : col === "D" ? "right" : "left",
        };
      });

      if (item.format && typeof item.val === "number") {
        cVal.numFmt = item.format;
      }
      currentRow++;
    });

    currentRow += 2; // Spacing

    // 3. Section: TREN PENJUALAN HARIAN
    sheet.getCell(`A${currentRow}`).value = "2. TREN PENJUALAN HARIAN";
    sheet.getCell(`A${currentRow}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: DARK_NAVY } };
    currentRow++;

    const dailyHeader = sheet.getRow(currentRow);
    dailyHeader.values = [
      "No",
      "Tanggal",
      "Hari / Label",
      "Total Omzet",
      "Jumlah Transaksi",
      "Produk Terjual",
      "Rata-rata / Nota",
    ];
    dailyHeader.height = 22;
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const c = sheet.getCell(`${col}${currentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BLUE } };
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      c.border = headerBorder;
      c.alignment = {
        vertical: "middle",
        horizontal: ["A", "B", "C"].includes(col) ? "center" : "right",
      };
    });
    currentRow++;

    let sumRevenue = 0;
    let sumTx = 0;
    let sumItems = 0;

    report.dailyTrend.forEach((d, idx) => {
      sumRevenue += d.revenue;
      sumTx += d.transactionsCount;
      sumItems += d.itemsCount;

      const row = sheet.getRow(currentRow);
      const avgNota = d.transactionsCount > 0 ? Math.round(d.revenue / d.transactionsCount) : 0;
      row.values = [
        idx + 1,
        d.date,
        d.dayLabel,
        d.revenue,
        d.transactionsCount,
        d.itemsCount,
        avgNota,
      ];

      const bg = idx % 2 === 1 ? ZEBRA_ROW : "FFFFFFFF";

      ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
        const c = sheet.getCell(`${col}${currentRow}`);
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        c.border = thinBorder;
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1A1A1A" } };
        c.alignment = {
          vertical: "middle",
          horizontal: ["A", "B", "C"].includes(col) ? "center" : "right",
        };

        if (col === "D" || col === "G") c.numFmt = '"Rp"#,##0';
        if (col === "E") c.numFmt = "#,##0";
        if (col === "F") c.numFmt = '#,##0" pcs"';
      });
      currentRow++;
    });

    // Daily Total Row
    const dailyTotalRow = sheet.getRow(currentRow);
    dailyTotalRow.values = [
      "",
      "TOTAL",
      "",
      sumRevenue,
      sumTx,
      sumItems,
      sumTx > 0 ? Math.round(sumRevenue / sumTx) : 0,
    ];
    dailyTotalRow.height = 21;
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const c = sheet.getCell(`${col}${currentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ICE_BLUE } };
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: DARK_NAVY } };
      c.border = totalBorder;
      c.alignment = {
        vertical: "middle",
        horizontal: ["A", "B", "C"].includes(col) ? "center" : "right",
      };
      if (col === "D" || col === "G") c.numFmt = '"Rp"#,##0';
      if (col === "E") c.numFmt = "#,##0";
      if (col === "F") c.numFmt = '#,##0" pcs"';
    });
    currentRow += 2;

    // 4. Section: 8 PRODUK TERLARIS (BEST SELLERS)
    sheet.getCell(`A${currentRow}`).value = "3. 8 PRODUK TERLARIS (TOP BEST SELLERS)";
    sheet.getCell(`A${currentRow}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: DARK_NAVY } };
    currentRow++;

    // Header: A=Peringkat, B:C=Nama Produk, D=Total Omzet, E=Unit Terjual, F=Estimasi Laba, G=Kategori
    const bestHRow = sheet.getRow(currentRow);
    sheet.getCell(`A${currentRow}`).value = "Peringkat";
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = "Nama Produk";
    sheet.getCell(`D${currentRow}`).value = "Total Omzet";
    sheet.getCell(`E${currentRow}`).value = "Unit Terjual";
    sheet.getCell(`F${currentRow}`).value = "Estimasi Laba";
    sheet.getCell(`G${currentRow}`).value = "Kategori";
    bestHRow.height = 22;

    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const c = sheet.getCell(`${col}${currentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BLUE } };
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      c.border = headerBorder;
      c.alignment = {
        vertical: "middle",
        horizontal: col === "A" ? "center" : ["B", "C", "G"].includes(col) ? "left" : "right",
      };
    });
    currentRow++;

    report.bestSellers.forEach((p, idx) => {
      sheet.getCell(`A${currentRow}`).value = `#${idx + 1}`;
      sheet.mergeCells(`B${currentRow}:C${currentRow}`);
      sheet.getCell(`B${currentRow}`).value = p.name;
      sheet.getCell(`D${currentRow}`).value = p.totalRevenue;
      sheet.getCell(`E${currentRow}`).value = p.quantitySold;
      sheet.getCell(`F${currentRow}`).value = p.profit;
      sheet.getCell(`G${currentRow}`).value = p.categoryName;

      const bg = idx % 2 === 1 ? ZEBRA_ROW : "FFFFFFFF";

      ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
        const c = sheet.getCell(`${col}${currentRow}`);
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        c.border = thinBorder;
        c.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1A1A1A" } };
        c.alignment = {
          vertical: "middle",
          horizontal: col === "A" ? "center" : ["B", "C", "G"].includes(col) ? "left" : "right",
        };
        if (col === "E") c.numFmt = '#,##0" pcs"';
        if (col === "D" || col === "F") c.numFmt = '"Rp"#,##0';
      });
      currentRow++;
    });

    currentRow += 2;

    // 5. Section: PENDAPATAN PER KATEGORI
    sheet.getCell(`A${currentRow}`).value = "4. PROPORSI PENDAPATAN PER KATEGORI";
    sheet.getCell(`A${currentRow}`).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: DARK_NAVY } };
    currentRow++;

    // Header: A=No, B:C=Kategori Produk, D=Total Omzet, E=Kuantitas Terjual, F:G=Porsi Penjualan (%)
    const catHRow = sheet.getRow(currentRow);
    sheet.getCell(`A${currentRow}`).value = "No";
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = "Kategori Produk";
    sheet.getCell(`D${currentRow}`).value = "Total Omzet";
    sheet.getCell(`E${currentRow}`).value = "Kuantitas Terjual";
    sheet.mergeCells(`F${currentRow}:G${currentRow}`);
    sheet.getCell(`F${currentRow}`).value = "Porsi Penjualan (%)";
    catHRow.height = 22;

    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const c = sheet.getCell(`${col}${currentRow}`);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BLUE } };
      c.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      c.border = headerBorder;
      c.alignment = {
        vertical: "middle",
        horizontal: col === "A" ? "center" : ["B", "C"].includes(col) ? "left" : "right",
      };
    });
    currentRow++;

    report.categoryBreakdown.forEach((c, idx) => {
      sheet.getCell(`A${currentRow}`).value = idx + 1;
      sheet.mergeCells(`B${currentRow}:C${currentRow}`);
      sheet.getCell(`B${currentRow}`).value = c.categoryName;
      sheet.getCell(`D${currentRow}`).value = c.totalRevenue;
      sheet.getCell(`E${currentRow}`).value = c.quantitySold;
      sheet.mergeCells(`F${currentRow}:G${currentRow}`);
      sheet.getCell(`F${currentRow}`).value = `${c.percentage}%`;

      const bg = idx % 2 === 1 ? ZEBRA_ROW : "FFFFFFFF";

      ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
        const cell = sheet.getCell(`${col}${currentRow}`);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.border = thinBorder;
        cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1A1A1A" } };
        cell.alignment = {
          vertical: "middle",
          horizontal: col === "A" ? "center" : ["B", "C"].includes(col) ? "left" : "right",
        };
        if (col === "D") cell.numFmt = '"Rp"#,##0';
        if (col === "E") cell.numFmt = '#,##0" pcs"';
      });
      currentRow++;
    });

    // Auto-fit Column Widths (A to G)
    // Dynamic measurement strictly on unmerged table cells, clamped between 7 and 22 points
    const baseColWidths = [7, 13, 15, 17, 14, 15, 16];
    sheet.columns.forEach((column, i) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        // Exclude banner header rows 1-4 and section titles
        if (Number(cell.row) <= 4) return;
        if (cell.isMerged) return;

        const val = cell.value ? String(cell.value) : "";
        if (/^[1-4]\.\s/.test(val)) return;

        let len = val.length;
        if (typeof cell.value === "number") {
          len = cell.numFmt?.includes("Rp") ? 14 : String(cell.value).length + 4;
        }

        if (len > maxLen && len < 30) {
          maxLen = len;
        }
      });

      const targetWidth = Math.max(maxLen + 3, baseColWidths[i] || 10);
      column.width = Math.min(Math.max(targetWidth, 7), 22);
    });

    // Write buffer & trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Keuangan_TokoKu_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
