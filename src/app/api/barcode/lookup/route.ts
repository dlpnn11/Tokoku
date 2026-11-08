import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  inferCategoryFromKeywords,
  inferUnitFromName,
  normalizeBarcode,
} from "@/services/barcodeCatalogService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rawCode = req.nextUrl.searchParams.get("code") || "";
    const cleanCode = normalizeBarcode(rawCode);

    if (!cleanCode || cleanCode.length < 8) {
      return NextResponse.json(
        {
          found: false,
          barcode: rawCode,
          message: "Kode barcode tidak valid atau terlalu pendek (minimal 8 digit).",
        },
        { status: 400 }
      );
    }

    // 1. Check store's Supabase products table first
    try {
      const orFilters = [`barcode.eq.${cleanCode}`, `sku.eq.${cleanCode}`];
      if (cleanCode.length === 13 && cleanCode.startsWith("0")) {
        orFilters.push(`barcode.eq.${cleanCode.slice(1)}`, `sku.eq.${cleanCode.slice(1)}`);
      } else if (cleanCode.length === 12) {
        orFilters.push(`barcode.eq.0${cleanCode}`, `sku.eq.0${cleanCode}`);
      }

      const { data: existingProduct, error } = await supabase
        .from("products")
        .select("name, buy_price, sell_price, unit, category:categories(name)")
        .or(orFilters.join(","))
        .limit(1)
        .maybeSingle();

      if (!error && existingProduct && existingProduct.name) {
        let catName: string | undefined;
        if (existingProduct.category) {
          if (Array.isArray(existingProduct.category) && existingProduct.category[0]) {
            catName = (existingProduct.category[0] as { name?: string }).name;
          } else {
            catName = (existingProduct.category as { name?: string }).name;
          }
        }

        return NextResponse.json({
          found: true,
          barcode: cleanCode,
          name: existingProduct.name,
          categoryName: catName,
          unit: existingProduct.unit || "pcs",
          suggestedBuyPrice: Number(existingProduct.buy_price) || 0,
          suggestedSellPrice: Number(existingProduct.sell_price) || 0,
          source: "database",
        });
      }
    } catch (dbErr) {
      console.warn("API barcode lookup database check failed:", dbErr);
    }

    // Resilient external fetch helper with 5s timeout & official User-Agent
    const fetchWithTimeout = async (url: string, timeoutMs = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "TokoKu-POS/1.0 (contact: info@tokoku.id)",
            Accept: "application/json",
          },
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    // 2. Fall back to Open Food Facts
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`;
      const offRes = await fetchWithTimeout(offUrl, 5000);
      if (offRes.ok) {
        const json = await offRes.json();
        if (json.status === 1 && json.product) {
          const p = json.product;
          let detectedName =
            p.product_name_id ||
            p.product_name ||
            p.product_name_en ||
            p.generic_name ||
            "";

          if (detectedName) {
            if (p.brands && typeof p.brands === "string") {
              const firstBrand = p.brands.split(",")[0].trim();
              if (
                firstBrand &&
                !detectedName.toLowerCase().includes(firstBrand.toLowerCase())
              ) {
                detectedName = `${firstBrand} ${detectedName}`;
              }
            }

            const rawCat = `${p.categories || ""} ${p.compared_to_category || ""} ${detectedName}`;
            return NextResponse.json({
              found: true,
              barcode: cleanCode,
              name: detectedName,
              categoryName: inferCategoryFromKeywords(rawCat),
              unit: inferUnitFromName(detectedName),
              source: "open_food_facts",
            });
          }
        }
      }
    } catch {
      // Continue to Open Beauty Facts fallback
    }

    // 3. Fall back to Open Beauty Facts (for toiletries, soaps, detergent, toothpaste)
    try {
      const obfUrl = `https://world.openbeautyfacts.org/api/v0/product/${encodeURIComponent(cleanCode)}.json`;
      const obfRes = await fetchWithTimeout(obfUrl, 5000);
      if (obfRes.ok) {
        const json = await obfRes.json();
        if (json.status === 1 && json.product) {
          const p = json.product;
          let detectedName =
            p.product_name_id ||
            p.product_name ||
            p.product_name_en ||
            p.generic_name ||
            "";

          if (detectedName) {
            if (p.brands && typeof p.brands === "string") {
              const firstBrand = p.brands.split(",")[0].trim();
              if (
                firstBrand &&
                !detectedName.toLowerCase().includes(firstBrand.toLowerCase())
              ) {
                detectedName = `${firstBrand} ${detectedName}`;
              }
            }

            const rawCat = `${p.categories || ""} ${p.compared_to_category || ""} ${detectedName}`;
            const categoryName = inferCategoryFromKeywords(rawCat);
            return NextResponse.json({
              found: true,
              barcode: cleanCode,
              name: detectedName,
              categoryName:
                categoryName === "Makanan Ringan / Snack"
                  ? "Kebutuhan Rumah Tangga / Kebersihan"
                  : categoryName,
              unit: inferUnitFromName(detectedName),
              source: "open_beauty_facts",
            });
          }
        }
      }
    } catch {
      // Continue to not found
    }

    // 4. Barcode not found in any master catalog
    return NextResponse.json({
      found: false,
      barcode: cleanCode,
    });
  } catch (error: unknown) {
    console.error("Barcode lookup route fatal error:", error);
    return NextResponse.json(
      { found: false, error: "Internal lookup error" },
      { status: 500 }
    );
  }
}
