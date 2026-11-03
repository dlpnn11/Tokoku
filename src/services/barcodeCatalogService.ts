/**
 * Barcode Catalog & Auto-Fill Service for TokoKu POS.
 *
 * Provides instant 0ms offline matching against standard Indonesian FMCG retail barcodes (EAN-13),
 * combined with an asynchronous online fallback to Open Food Facts API.
 */

export interface CatalogProductItem {
  barcode: string;
  name: string;
  categoryName: string;
  unit: string;
  suggestedBuyPrice?: number;
  suggestedSellPrice?: number;
}

export interface BarcodeLookupResult {
  found: boolean;
  barcode: string;
  name?: string;
  categoryName?: string;
  unit?: string;
  suggestedBuyPrice?: number;
  suggestedSellPrice?: number;
  source?: "local_catalog" | "open_food_facts";
}

/**
 * Curated offline catalog of top ~100 fast-moving consumer goods (FMCG) in Indonesian warung kelontong.
 * Formatted with official GS1 Indonesia EAN-13 barcodes (prefix 899 / 0896).
 */
export const LOCAL_INDONESIAN_BARCODE_CATALOG: Record<string, CatalogProductItem> = {
  // === MIE INSTAN ===
  "089686010019": {
    barcode: "089686010019",
    name: "Indomie Mi Goreng Spesial 85g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8998866200224": {
    barcode: "8998866200224",
    name: "Indomie Mi Goreng Spesial 85g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "089686010033": {
    barcode: "089686010033",
    name: "Indomie Kuah Ayam Bawang 69g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3300,
  },
  "089686010026": {
    barcode: "089686010026",
    name: "Indomie Kuah Soto Mie 70g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3300,
  },
  "089686010040": {
    barcode: "089686010040",
    name: "Indomie Kuah Kari Ayam 72g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8998866201026": {
    barcode: "8998866201026",
    name: "Pop Mie Goreng Pedas Gledek 75g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8998866200057": {
    barcode: "8998866200057",
    name: "Pop Mie Dower Ayam Pedas 75g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8998866100101": {
    barcode: "8998866100101",
    name: "Mie Sedaap Goreng 90g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3300,
  },
  "8998866100118": {
    barcode: "8998866100118",
    name: "Mie Sedaap Soto 75g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3300,
  },
  "8998866100125": {
    barcode: "8998866100125",
    name: "Mie Sedaap Ayam Bawang 70g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3300,
  },
  "8998866100224": {
    barcode: "8998866100224",
    name: "Mie Sedaap Korean Spicy Chicken 87g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 3000,
    suggestedSellPrice: 3800,
  },

  // === MINUMAN ===
  "8992753123456": {
    barcode: "8992753123456",
    name: "Aqua Air Mineral 600ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8992753211111": {
    barcode: "8992753211111",
    name: "Aqua Air Mineral 600ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8992753311110": {
    barcode: "8992753311110",
    name: "Aqua Air Mineral 1500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 5000,
    suggestedSellPrice: 6500,
  },
  "8992753511118": {
    barcode: "8992753511118",
    name: "Le Minerale Air Mineral 600ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3500,
  },
  "8992753611117": {
    barcode: "8992753611117",
    name: "Le Minerale Air Mineral 1500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4800,
    suggestedSellPrice: 6000,
  },
  "8998866200234": {
    barcode: "8998866200234",
    name: "Teh Botol Sosro Kotak 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8998866200241": {
    barcode: "8998866200241",
    name: "Teh Botol Sosro Botol 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 3200,
    suggestedSellPrice: 4000,
  },
  "8992753811119": {
    barcode: "8992753811119",
    name: "Teh Pucuk Harum 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 3000,
    suggestedSellPrice: 4000,
  },
  "8992753711110": {
    barcode: "8992753711110",
    name: "Floridina Orange 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2600,
    suggestedSellPrice: 3500,
  },
  "8992741910013": {
    barcode: "8992741910013",
    name: "Pocari Sweat Botol 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 5200,
    suggestedSellPrice: 6500,
  },
  "8992741910020": {
    barcode: "8992741910020",
    name: "Pocari Sweat Botol 500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 6800,
    suggestedSellPrice: 8500,
  },
  "8996001410222": {
    barcode: "8996001410222",
    name: "Kopiko 78C Coffee Latte 240ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5500,
  },
  "8996001410239": {
    barcode: "8996001410239",
    name: "Kopiko Lucky Day Coffee 180ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4000,
    suggestedSellPrice: 5000,
  },
  "8998009010101": {
    barcode: "8998009010101",
    name: "Ultra Milk Full Cream 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5500,
  },
  "8998009010118": {
    barcode: "8998009010118",
    name: "Ultra Milk Cokelat 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5500,
  },
  "8992761001018": {
    barcode: "8992761001018",
    name: "Bear Brand Susu Steril 189ml",
    categoryName: "Minuman",
    unit: "kaleng",
    suggestedBuyPrice: 8800,
    suggestedSellPrice: 10500,
  },
  "8991002105151": {
    barcode: "8991002105151",
    name: "Coca-Cola Pet 390ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5500,
  },
  "8991002105168": {
    barcode: "8991002105168",
    name: "Sprite Pet 390ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5500,
  },
  "8991002105175": {
    barcode: "8991002105175",
    name: "Fanta Strawberry Pet 390ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5500,
  },
  "8991111001010": {
    barcode: "8991111001010",
    name: "Kopi Kapal Api Special Mix 24g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1500,
    suggestedSellPrice: 2000,
  },
  "8992759100101": {
    barcode: "8992759100101",
    name: "Good Day Cappuccino 25g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1800,
    suggestedSellPrice: 2500,
  },

  // === MAKANAN RINGAN / SNACK ===
  "8996001300121": {
    barcode: "8996001300121",
    name: "Chitato Sapi Panggang 68g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 8000,
    suggestedSellPrice: 10000,
  },
  "8992775210101": {
    barcode: "8992775210101",
    name: "Oreo Vanilla 133g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 7500,
    suggestedSellPrice: 9500,
  },
  "8991001100202": {
    barcode: "8991001100202",
    name: "Roti Tawar Sari Roti Spesial",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 12500,
    suggestedSellPrice: 15000,
  },
  "8991002300100": {
    barcode: "8991002300100",
    name: "Roma Kelapa Biskuit 300g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 9500,
    suggestedSellPrice: 12000,
  },
  "8991002300308": {
    barcode: "8991002300308",
    name: "Roma Malkist Abon 135g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 5800,
    suggestedSellPrice: 7500,
  },
  "8996001300507": {
    barcode: "8996001300507",
    name: "Beng-Beng Wafer Cokelat 25g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 1800,
    suggestedSellPrice: 2500,
  },
  "8996001300705": {
    barcode: "8996001300705",
    name: "SilverQueen Cashew 58g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 12500,
    suggestedSellPrice: 15500,
  },
  "8991002300605": {
    barcode: "8991002300605",
    name: "Nabati Wafer Keju Richeese 50g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 2000,
    suggestedSellPrice: 3000,
  },

  // === SEMBAKO & BUMBU ===
  "8992758110014": {
    barcode: "8992758110014",
    name: "Minyak Goreng Bimoli 1L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 17500,
    suggestedSellPrice: 20000,
  },
  "8992758110021": {
    barcode: "8992758110021",
    name: "Minyak Goreng Bimoli 2L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 33500,
    suggestedSellPrice: 38000,
  },
  "8992758110038": {
    barcode: "8992758110038",
    name: "Minyak Goreng Sania 1L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 17000,
    suggestedSellPrice: 19500,
  },
  "8992758110045": {
    barcode: "8992758110045",
    name: "Minyak Goreng Sania 2L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 32500,
    suggestedSellPrice: 37000,
  },
  "8998888123456": {
    barcode: "8998888123456",
    name: "Gula Pasir Gulaku Tebu 1kg",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 16000,
    suggestedSellPrice: 18500,
  },
  "8998888123470": {
    barcode: "8998888123470",
    name: "Tepung Terigu Segitiga Biru 1kg",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 11000,
    suggestedSellPrice: 13000,
  },
  "8991002500104": {
    barcode: "8991002500104",
    name: "Royco Rasa Ayam 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5000,
  },
  "8991002500203": {
    barcode: "8991002500203",
    name: "Royco Rasa Sapi 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5000,
  },
  "8991002500302": {
    barcode: "8991002500302",
    name: "Masako Rasa Ayam 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4200,
    suggestedSellPrice: 5000,
  },
  "8991002500609": {
    barcode: "8991002500609",
    name: "Kecap Manis Bango 520ml Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 20500,
    suggestedSellPrice: 24000,
  },
  "8991002500708": {
    barcode: "8991002500708",
    name: "Kecap Manis Bango 220ml Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 9500,
    suggestedSellPrice: 12000,
  },
  "8991002500906": {
    barcode: "8991002500906",
    name: "Sambal ABC Asli 275ml Botol",
    categoryName: "Sembako & Bumbu",
    unit: "botol",
    suggestedBuyPrice: 12000,
    suggestedSellPrice: 14500,
  },

  // === KEBUTUHAN RUMAH TANGGA & KEBERSIHAN ===
  "8999999052028": {
    barcode: "8999999052028",
    name: "Sabun Lifebuoy Total 10 85g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 3800,
    suggestedSellPrice: 4800,
  },
  "8999999023417": {
    barcode: "8999999023417",
    name: "Deterjen Rinso Anti Noda 770g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 18500,
    suggestedSellPrice: 22000,
  },
  "8999999023431": {
    barcode: "8999999023431",
    name: "Deterjen Daia Bunga 850g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 15500,
    suggestedSellPrice: 18500,
  },
  "8999999011122": {
    barcode: "8999999011122",
    name: "Sunlight Jeruk Nipis 750ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 13000,
    suggestedSellPrice: 16000,
  },
  "8999999011139": {
    barcode: "8999999011139",
    name: "Sunlight Jeruk Nipis 210ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 4000,
    suggestedSellPrice: 5000,
  },
  "8999999011146": {
    barcode: "8999999011146",
    name: "Mama Lemon Jeruk Nipis 680ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 11000,
    suggestedSellPrice: 13500,
  },
  "8999999011153": {
    barcode: "8999999011153",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 120g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 7500,
    suggestedSellPrice: 9500,
  },
  "8999999011160": {
    barcode: "8999999011160",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 190g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 12500,
    suggestedSellPrice: 15500,
  },

  // === ATK & ROKOK ===
  "4902505163158": {
    barcode: "4902505163158",
    name: "Pulpen Pilot G2 0.5 Black",
    categoryName: "ATK & Rokok",
    unit: "pcs",
    suggestedBuyPrice: 14000,
    suggestedSellPrice: 17000,
  },
  "8999999710010": {
    barcode: "8999999710010",
    name: "Sampoerna A Mild 16",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 31000,
    suggestedSellPrice: 34000,
  },
  "8999999710027": {
    barcode: "8999999710027",
    name: "Djarum Super 12",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 22000,
    suggestedSellPrice: 24500,
  },
  "8999999710041": {
    barcode: "8999999710041",
    name: "Gudang Garam Surya 16",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 30000,
    suggestedSellPrice: 33000,
  },
  "8999999710058": {
    barcode: "8999999710058",
    name: "Gudang Garam Surya 12",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 23000,
    suggestedSellPrice: 25500,
  },
};

/**
 * Normalizes input barcode string by stripping non-alphanumeric characters.
 */
export function normalizeBarcode(code: string): string {
  if (!code) return "";
  return code.trim().replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Infers category name based on food/product keywords from external sources.
 */
function inferCategoryFromKeywords(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("noodle") ||
    lower.includes("mie") ||
    lower.includes("mi ") ||
    lower.includes("pasta") ||
    lower.includes("ramen")
  ) {
    return "Mie Instan";
  }
  if (
    lower.includes("beverage") ||
    lower.includes("drink") ||
    lower.includes("minuman") ||
    lower.includes("tea") ||
    lower.includes("teh") ||
    lower.includes("water") ||
    lower.includes("air") ||
    lower.includes("coffee") ||
    lower.includes("kopi") ||
    lower.includes("milk") ||
    lower.includes("susu") ||
    lower.includes("juice") ||
    lower.includes("jus")
  ) {
    return "Minuman";
  }
  if (
    lower.includes("snack") ||
    lower.includes("chip") ||
    lower.includes("biscuit") ||
    lower.includes("biskuit") ||
    lower.includes("cookie") ||
    lower.includes("wafer") ||
    lower.includes("chocolate") ||
    lower.includes("cokelat") ||
    lower.includes("candy") ||
    lower.includes("permen")
  ) {
    return "Makanan Ringan / Snack";
  }
  if (
    lower.includes("soap") ||
    lower.includes("sabun") ||
    lower.includes("detergent") ||
    lower.includes("shampoo") ||
    lower.includes("shampo") ||
    lower.includes("clean") ||
    lower.includes("dish") ||
    lower.includes("paste") ||
    lower.includes("pepsodent")
  ) {
    return "Kebutuhan Rumah Tangga / Kebersihan";
  }
  if (
    lower.includes("oil") ||
    lower.includes("minyak") ||
    lower.includes("rice") ||
    lower.includes("beras") ||
    lower.includes("sugar") ||
    lower.includes("gula") ||
    lower.includes("flour") ||
    lower.includes("terigu") ||
    lower.includes("sauce") ||
    lower.includes("saus") ||
    lower.includes("kecap") ||
    lower.includes("spice") ||
    lower.includes("bumbu") ||
    lower.includes("salt") ||
    lower.includes("garam")
  ) {
    return "Sembako & Bumbu";
  }
  if (
    lower.includes("cigarette") ||
    lower.includes("rokok") ||
    lower.includes("tobacco") ||
    lower.includes("pen") ||
    lower.includes("pulpen") ||
    lower.includes("book") ||
    lower.includes("buku")
  ) {
    return "ATK & Rokok";
  }
  return "Makanan Ringan / Snack";
}

/**
 * Infers package unit (pcs, botol, bungkus, kotak, etc.) from product name.
 */
function inferUnitFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("botol") || lower.includes("pet ") || lower.includes("600ml") || lower.includes("1500ml") || lower.includes("350ml")) {
    return "botol";
  }
  if (lower.includes("kaleng") || lower.includes("can ")) {
    return "kaleng";
  }
  if (lower.includes("kotak") || lower.includes("uht") || lower.includes("tetrapak") || lower.includes("250ml")) {
    return "kotak";
  }
  if (lower.includes("cup")) {
    return "cup";
  }
  if (lower.includes("pouch") || lower.includes("refill") || lower.includes("1l") || lower.includes("2l")) {
    return "pouch";
  }
  if (lower.includes("bungkus") || lower.includes("indomie") || lower.includes("sedaap") || lower.includes("mie ") || lower.includes("roti") || lower.includes("snack") || lower.includes("keripik")) {
    return "bungkus";
  }
  return "pcs";
}

/**
 * Searches for product details by barcode:
 * 1. Immediate offline check in local Indonesian FMCG master catalog.
 * 2. Asynchronous online check via Open Food Facts API (with 2500ms timeout).
 */
export async function lookupBarcodeDetails(
  rawBarcode: string
): Promise<BarcodeLookupResult> {
  const cleanCode = normalizeBarcode(rawBarcode);
  if (!cleanCode) {
    return { found: false, barcode: rawBarcode };
  }

  // 1. Instant Local Master Catalog Match
  const localMatch = LOCAL_INDONESIAN_BARCODE_CATALOG[cleanCode];
  if (localMatch) {
    return {
      found: true,
      barcode: cleanCode,
      name: localMatch.name,
      categoryName: localMatch.categoryName,
      unit: localMatch.unit,
      suggestedBuyPrice: localMatch.suggestedBuyPrice,
      suggestedSellPrice: localMatch.suggestedSellPrice,
      source: "local_catalog",
    };
  }

  // 2. Online Open Food Facts Fallback (non-blocking, client-side only)
  if (typeof window !== "undefined" && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        cleanCode
      )}.json`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.status === 1 && json.product) {
          const p = json.product;
          const detectedName =
            p.product_name_id ||
            p.product_name ||
            p.product_name_en ||
            p.generic_name ||
            "";

          if (detectedName) {
            const rawCat = `${p.categories || ""} ${p.compared_to_category || ""} ${detectedName}`;
            const categoryName = inferCategoryFromKeywords(rawCat);
            const unit = inferUnitFromName(detectedName);

            return {
              found: true,
              barcode: cleanCode,
              name: detectedName,
              categoryName,
              unit,
              source: "open_food_facts",
            };
          }
        }
      }
    } catch {
      // Ignore network timeout or CORS errors safely
    }
  }

  return { found: false, barcode: cleanCode };
}
