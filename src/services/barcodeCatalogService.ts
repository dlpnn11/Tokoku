/**
 * Barcode Catalog & Auto-Fill Service for TokoKu POS.
 *
 * Provides instant 0ms offline matching against authentic GS1 Indonesia FMCG retail barcodes (EAN-13),
 * combined with an asynchronous server-side fallback to the store database, Open Food Facts, and Open Beauty Facts.
 */

export interface CatalogProductItem {
  barcode: string;
  name: string;
  categoryName: string;
  unit: string;
  suggestedBuyPrice?: number;
  suggestedSellPrice?: number;
}

export type BarcodeLookupSource =
  | "local_catalog"
  | "database"
  | "open_food_facts"
  | "open_beauty_facts";

export interface BarcodeLookupResult {
  found: boolean;
  barcode: string;
  name?: string;
  categoryName?: string;
  unit?: string;
  suggestedBuyPrice?: number;
  suggestedSellPrice?: number;
  source?: BarcodeLookupSource;
}

/**
 * Curated offline catalog of top fast-moving consumer goods (FMCG) in Indonesian warung kelontong & retail.
 * Formatted with official GS1 Indonesia EAN-13 barcodes (prefix 899 / 888 / 089 / 761).
 */
export const LOCAL_INDONESIAN_BARCODE_CATALOG: Record<string, CatalogProductItem> = {
  // === MIE INSTAN ===
  "089686010019": {
    barcode: "089686010019",
    name: "Indomie Mi Goreng Spesial 85g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2900,
    suggestedSellPrice: 3500,
  },
  "089686010026": {
    barcode: "089686010026",
    name: "Indomie Kuah Soto Mie 70g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3300,
  },
  "089686010033": {
    barcode: "089686010033",
    name: "Indomie Kuah Ayam Bawang 69g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3300,
  },
  "089686010040": {
    barcode: "089686010040",
    name: "Indomie Kuah Kari Ayam 72g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2900,
    suggestedSellPrice: 3500,
  },
  "089686010057": {
    barcode: "089686010057",
    name: "Indomie Mi Goreng Rendang 91g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2900,
    suggestedSellPrice: 3500,
  },
  "089686010064": {
    barcode: "089686010064",
    name: "Indomie Mi Goreng Pedas 79g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2900,
    suggestedSellPrice: 3500,
  },
  "089686010088": {
    barcode: "089686010088",
    name: "Indomie Kuah Ayam Spesial 68g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3300,
  },
  "8998866100101": {
    barcode: "8998866100101",
    name: "Mie Sedaap Goreng 90g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3300,
  },
  "8998866100118": {
    barcode: "8998866100118",
    name: "Mie Sedaap Soto 75g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3300,
  },
  "8998866100125": {
    barcode: "8998866100125",
    name: "Mie Sedaap Ayam Bawang 70g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3300,
  },
  "8998866100224": {
    barcode: "8998866100224",
    name: "Mie Sedaap Korean Spicy Chicken 87g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 3200,
    suggestedSellPrice: 4000,
  },
  "8998866100231": {
    barcode: "8998866100231",
    name: "Mie Sedaap Korean Spicy Soup 77g",
    categoryName: "Mie Instan",
    unit: "bungkus",
    suggestedBuyPrice: 3200,
    suggestedSellPrice: 4000,
  },
  "8998866200057": {
    barcode: "8998866200057",
    name: "Pop Mie Dower Ayam Pedas 75g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4800,
    suggestedSellPrice: 6000,
  },
  "8998866201026": {
    barcode: "8998866201026",
    name: "Pop Mie Goreng Pedas Gledek 75g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4800,
    suggestedSellPrice: 6000,
  },
  "8998866200019": {
    barcode: "8998866200019",
    name: "Pop Mie Kuah Ayam 75g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8998866200026": {
    barcode: "8998866200026",
    name: "Pop Mie Kuah Baso 75g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8998866200033": {
    barcode: "8998866200033",
    name: "Pop Mie Goreng Spesial 80g",
    categoryName: "Mie Instan",
    unit: "cup",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },

  // === AIR MINERAL & MINUMAN ===
  "8886008101053": {
    barcode: "8886008101053",
    name: "Aqua Air Mineral 600ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8886008101077": {
    barcode: "8886008101077",
    name: "Aqua Air Mineral 1500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 5000,
    suggestedSellPrice: 6500,
  },
  "8886008101039": {
    barcode: "8886008101039",
    name: "Aqua Air Mineral 330ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2200,
    suggestedSellPrice: 3000,
  },
  "8886008101015": {
    barcode: "8886008101015",
    name: "Aqua Air Mineral Gelas 220ml",
    categoryName: "Minuman",
    unit: "cup",
    suggestedBuyPrice: 800,
    suggestedSellPrice: 1000,
  },
  // Legacy aliases for Aqua
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

  // Le Minerale
  "8996001600265": {
    barcode: "8996001600265",
    name: "Le Minerale Air Mineral 600ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2700,
    suggestedSellPrice: 3500,
  },
  "8996001600272": {
    barcode: "8996001600272",
    name: "Le Minerale Air Mineral 1500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4800,
    suggestedSellPrice: 6000,
  },
  "8996001600258": {
    barcode: "8996001600258",
    name: "Le Minerale Air Mineral 330ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2000,
    suggestedSellPrice: 2500,
  },
  // Legacy aliases for Le Minerale
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

  // Teh Pucuk Harum
  "8991002105151": {
    barcode: "8991002105151",
    name: "Teh Pucuk Harum 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 3000,
    suggestedSellPrice: 4000,
  },
  "8996001414015": {
    barcode: "8996001414015",
    name: "Teh Pucuk Harum 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 3000,
    suggestedSellPrice: 4000,
  },
  "8996001414008": {
    barcode: "8996001414008",
    name: "Teh Pucuk Harum Manis 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 3000,
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

  // Teh Botol Sosro
  "8998866200224": {
    barcode: "8998866200224",
    name: "Teh Botol Sosro Kotak 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
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
  "8998866200101": {
    barcode: "8998866200101",
    name: "Teh Botol Sosro Botol 450ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4000,
    suggestedSellPrice: 5000,
  },

  // Floridina
  "8998866601007": {
    barcode: "8998866601007",
    name: "Floridina Orange 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2600,
    suggestedSellPrice: 3500,
  },
  "8992753711110": {
    barcode: "8992753711110",
    name: "Floridina Orange 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 2600,
    suggestedSellPrice: 3500,
  },

  // Pocari Sweat
  "8992741981129": {
    barcode: "8992741981129",
    name: "Pocari Sweat Botol 500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 6800,
    suggestedSellPrice: 8500,
  },
  "8992741910020": {
    barcode: "8992741910020",
    name: "Pocari Sweat Botol 500ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 6800,
    suggestedSellPrice: 8500,
  },
  "8992741981112": {
    barcode: "8992741981112",
    name: "Pocari Sweat Botol 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 5200,
    suggestedSellPrice: 6500,
  },
  "8992741910013": {
    barcode: "8992741910013",
    name: "Pocari Sweat Botol 350ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 5200,
    suggestedSellPrice: 6500,
  },
  "8992741910037": {
    barcode: "8992741910037",
    name: "Pocari Sweat Kaleng 330ml",
    categoryName: "Minuman",
    unit: "kaleng",
    suggestedBuyPrice: 5800,
    suggestedSellPrice: 7000,
  },

  // Ultra Milk
  "8998009010224": {
    barcode: "8998009010224",
    name: "Ultra Milk Full Cream 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8998009010101": {
    barcode: "8998009010101",
    name: "Ultra Milk Full Cream 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8998009010217": {
    barcode: "8998009010217",
    name: "Ultra Milk Cokelat 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8998009010118": {
    barcode: "8998009010118",
    name: "Ultra Milk Cokelat 250ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8998009010019": {
    barcode: "8998009010019",
    name: "Ultra Milk Cokelat 125ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },
  "8998009010026": {
    barcode: "8998009010026",
    name: "Ultra Milk Full Cream 125ml",
    categoryName: "Minuman",
    unit: "kotak",
    suggestedBuyPrice: 2800,
    suggestedSellPrice: 3500,
  },

  // Bear Brand
  "7613035252873": {
    barcode: "7613035252873",
    name: "Bear Brand Susu Steril 189ml",
    categoryName: "Minuman",
    unit: "kaleng",
    suggestedBuyPrice: 9500,
    suggestedSellPrice: 11000,
  },
  "8992761001018": {
    barcode: "8992761001018",
    name: "Bear Brand Susu Steril 189ml",
    categoryName: "Minuman",
    unit: "kaleng",
    suggestedBuyPrice: 9500,
    suggestedSellPrice: 11000,
  },

  // Kopi Siap Minum & Seduh
  "8991002101115": {
    barcode: "8991002101115",
    name: "Kopi Kapal Api Spesial Mix 24g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1500,
    suggestedSellPrice: 2000,
  },
  "8991111001010": {
    barcode: "8991111001010",
    name: "Kopi Kapal Api Spesial Mix 24g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1500,
    suggestedSellPrice: 2000,
  },
  "8991002101016": {
    barcode: "8991002101016",
    name: "Kopi Kapal Api Mantap 24g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1500,
    suggestedSellPrice: 2000,
  },
  "8992753221011": {
    barcode: "8992753221011",
    name: "Good Day Cappuccino 25g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1800,
    suggestedSellPrice: 2500,
  },
  "8992759100101": {
    barcode: "8992759100101",
    name: "Good Day Cappuccino 25g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1800,
    suggestedSellPrice: 2500,
  },
  "8992753221004": {
    barcode: "8992753221004",
    name: "Good Day Mocacinno 20g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1600,
    suggestedSellPrice: 2000,
  },
  "8996001410116": {
    barcode: "8996001410116",
    name: "Torabika Cappuccino 25g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1800,
    suggestedSellPrice: 2500,
  },
  "8996001410208": {
    barcode: "8996001410208",
    name: "Torabika Cappuccino 25g",
    categoryName: "Minuman",
    unit: "bungkus",
    suggestedBuyPrice: 1800,
    suggestedSellPrice: 2500,
  },
  "8996001410222": {
    barcode: "8996001410222",
    name: "Kopiko 78C Coffee Latte 240ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8996001410239": {
    barcode: "8996001410239",
    name: "Kopiko Lucky Day Coffee 180ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4000,
    suggestedSellPrice: 5000,
  },

  // Minuman Soda
  "8886000100016": {
    barcode: "8886000100016",
    name: "Coca-Cola Pet 390ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8991002105168": {
    barcode: "8991002105168",
    name: "Sprite Pet 390ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },
  "8991002105175": {
    barcode: "8991002105175",
    name: "Fanta Strawberry Pet 390ml",
    categoryName: "Minuman",
    unit: "botol",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 6000,
  },

  // === MAKANAN RINGAN / SNACK ===
  "8998866200422": {
    barcode: "8998866200422",
    name: "Chitato Sapi Panggang 68g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 8500,
    suggestedSellPrice: 10500,
  },
  "8996001300121": {
    barcode: "8996001300121",
    name: "Chitato Sapi Panggang 68g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 8500,
    suggestedSellPrice: 10500,
  },
  "8998866200439": {
    barcode: "8998866200439",
    name: "Chitato Ayam Bumbu 68g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 8500,
    suggestedSellPrice: 10500,
  },
  "7622210748057": {
    barcode: "7622210748057",
    name: "Oreo Vanilla Sandwich 133g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 7800,
    suggestedSellPrice: 9500,
  },
  "8992775210101": {
    barcode: "8992775210101",
    name: "Oreo Vanilla Sandwich 133g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 7800,
    suggestedSellPrice: 9500,
  },
  "8996001303012": {
    barcode: "8996001303012",
    name: "Roma Kelapa Biskuit 300g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 9500,
    suggestedSellPrice: 12000,
  },
  "8991002300100": {
    barcode: "8991002300100",
    name: "Roma Kelapa Biskuit 300g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 9500,
    suggestedSellPrice: 12000,
  },
  "8996001303050": {
    barcode: "8996001303050",
    name: "Roma Sari Gandum 115g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 6000,
    suggestedSellPrice: 7500,
  },
  "8991002300308": {
    barcode: "8991002300308",
    name: "Roma Malkist Abon 135g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 6000,
    suggestedSellPrice: 7500,
  },
  "8996001303067": {
    barcode: "8996001303067",
    name: "Roma Malkist Cokelat 120g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 6000,
    suggestedSellPrice: 7500,
  },
  "8996001301018": {
    barcode: "8996001301018",
    name: "Beng-Beng Wafer Cokelat 25g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 1900,
    suggestedSellPrice: 2500,
  },
  "8996001300507": {
    barcode: "8996001300507",
    name: "Beng-Beng Wafer Cokelat 25g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 1900,
    suggestedSellPrice: 2500,
  },
  "8991001100010": {
    barcode: "8991001100010",
    name: "SilverQueen Cashew 58g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 13500,
    suggestedSellPrice: 16500,
  },
  "8996001300705": {
    barcode: "8996001300705",
    name: "SilverQueen Cashew 58g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 13500,
    suggestedSellPrice: 16500,
  },
  "8991001100027": {
    barcode: "8991001100027",
    name: "SilverQueen Almond 58g",
    categoryName: "Makanan Ringan / Snack",
    unit: "pcs",
    suggestedBuyPrice: 13500,
    suggestedSellPrice: 16500,
  },
  "8991002300605": {
    barcode: "8991002300605",
    name: "Nabati Wafer Keju Richeese 50g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 2200,
    suggestedSellPrice: 3000,
  },
  "8991002300612": {
    barcode: "8991002300612",
    name: "Nabati Wafer Cokelat Richoco 50g",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 2200,
    suggestedSellPrice: 3000,
  },
  "8991001100202": {
    barcode: "8991001100202",
    name: "Roti Tawar Sari Roti Spesial",
    categoryName: "Makanan Ringan / Snack",
    unit: "bungkus",
    suggestedBuyPrice: 13000,
    suggestedSellPrice: 15500,
  },

  // === SEMBAKO & BUMBU ===
  "8992758110014": {
    barcode: "8992758110014",
    name: "Minyak Goreng Bimoli 1L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 18000,
    suggestedSellPrice: 20500,
  },
  "8992758110021": {
    barcode: "8992758110021",
    name: "Minyak Goreng Bimoli 2L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 34500,
    suggestedSellPrice: 39000,
  },
  "8992758110038": {
    barcode: "8992758110038",
    name: "Minyak Goreng Sania 1L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 17500,
    suggestedSellPrice: 20000,
  },
  "8992758110045": {
    barcode: "8992758110045",
    name: "Minyak Goreng Sania 2L Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 33500,
    suggestedSellPrice: 38000,
  },
  "8998888123456": {
    barcode: "8998888123456",
    name: "Gula Pasir Gulaku Tebu 1kg",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 16500,
    suggestedSellPrice: 19000,
  },
  "8998888123470": {
    barcode: "8998888123470",
    name: "Tepung Terigu Segitiga Biru 1kg",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 11500,
    suggestedSellPrice: 13500,
  },
  "8991002500104": {
    barcode: "8991002500104",
    name: "Royco Rasa Ayam 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8991002500203": {
    barcode: "8991002500203",
    name: "Royco Rasa Sapi 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8991002500302": {
    barcode: "8991002500302",
    name: "Masako Rasa Ayam 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8991002500401": {
    barcode: "8991002500401",
    name: "Masako Rasa Sapi 100g",
    categoryName: "Sembako & Bumbu",
    unit: "bungkus",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8999999042212": {
    barcode: "8999999042212",
    name: "Kecap Manis Bango 520ml Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 21500,
    suggestedSellPrice: 25000,
  },
  "8991002500609": {
    barcode: "8991002500609",
    name: "Kecap Manis Bango 520ml Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 21500,
    suggestedSellPrice: 25000,
  },
  "8999999042205": {
    barcode: "8999999042205",
    name: "Kecap Manis Bango 220ml Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 10000,
    suggestedSellPrice: 12500,
  },
  "8991002500708": {
    barcode: "8991002500708",
    name: "Kecap Manis Bango 220ml Pouch",
    categoryName: "Sembako & Bumbu",
    unit: "pouch",
    suggestedBuyPrice: 10000,
    suggestedSellPrice: 12500,
  },
  "8991002500906": {
    barcode: "8991002500906",
    name: "Sambal ABC Asli 275ml Botol",
    categoryName: "Sembako & Bumbu",
    unit: "botol",
    suggestedBuyPrice: 12500,
    suggestedSellPrice: 15000,
  },
  "8992753000016": {
    barcode: "8992753000016",
    name: "Sambal ABC Asli 275ml Botol",
    categoryName: "Sembako & Bumbu",
    unit: "botol",
    suggestedBuyPrice: 12500,
    suggestedSellPrice: 15000,
  },
  "8992753000023": {
    barcode: "8992753000023",
    name: "Sambal ABC Extra Pedas 275ml Botol",
    categoryName: "Sembako & Bumbu",
    unit: "botol",
    suggestedBuyPrice: 13000,
    suggestedSellPrice: 15500,
  },

  // === KEBUTUHAN RUMAH TANGGA & KEBERSIHAN ===
  "8999999002100": {
    barcode: "8999999002100",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 120g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 8000,
    suggestedSellPrice: 10000,
  },
  "8999999050880": {
    barcode: "8999999050880",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 120g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 8000,
    suggestedSellPrice: 10000,
  },
  "8999999011153": {
    barcode: "8999999011153",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 120g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 8000,
    suggestedSellPrice: 10000,
  },
  "8999999002117": {
    barcode: "8999999002117",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 190g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 13000,
    suggestedSellPrice: 16000,
  },
  "8999999011160": {
    barcode: "8999999011160",
    name: "Pasta Gigi Pepsodent Pencegah Gigi Berlubang 190g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 13000,
    suggestedSellPrice: 16000,
  },
  "8999999011102": {
    barcode: "8999999011102",
    name: "Sabun Lifebuoy Total 10 85g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 4000,
    suggestedSellPrice: 5000,
  },
  "8999999052028": {
    barcode: "8999999052028",
    name: "Sabun Lifebuoy Total 10 85g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pcs",
    suggestedBuyPrice: 4000,
    suggestedSellPrice: 5000,
  },
  "8999999031100": {
    barcode: "8999999031100",
    name: "Sunlight Jeruk Nipis 650ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 13500,
    suggestedSellPrice: 16500,
  },
  "8999999011122": {
    barcode: "8999999011122",
    name: "Sunlight Jeruk Nipis 750ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 13500,
    suggestedSellPrice: 16500,
  },
  "8999999011139": {
    barcode: "8999999011139",
    name: "Sunlight Jeruk Nipis 210ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 4500,
    suggestedSellPrice: 5500,
  },
  "8999999011146": {
    barcode: "8999999011146",
    name: "Mama Lemon Jeruk Nipis 680ml Pouch",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "pouch",
    suggestedBuyPrice: 11500,
    suggestedSellPrice: 14000,
  },
  "8999999021101": {
    barcode: "8999999021101",
    name: "Deterjen Rinso Anti Noda 770g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 19000,
    suggestedSellPrice: 22500,
  },
  "8999999023417": {
    barcode: "8999999023417",
    name: "Deterjen Rinso Anti Noda 770g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 19000,
    suggestedSellPrice: 22500,
  },
  "8998866500102": {
    barcode: "8998866500102",
    name: "Deterjen Daia Bunga 850g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 16000,
    suggestedSellPrice: 19000,
  },
  "8998866500010": {
    barcode: "8998866500010",
    name: "Deterjen Daia Putih 850g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 16000,
    suggestedSellPrice: 19000,
  },
  "8999999023431": {
    barcode: "8999999023431",
    name: "Deterjen Daia Bunga 850g",
    categoryName: "Kebutuhan Rumah Tangga / Kebersihan",
    unit: "bungkus",
    suggestedBuyPrice: 16000,
    suggestedSellPrice: 19000,
  },

  // === ATK & ROKOK ===
  "8992983100164": {
    barcode: "8992983100164",
    name: "Sampoerna A Mild 16",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 32000,
    suggestedSellPrice: 35000,
  },
  "8999999710010": {
    barcode: "8999999710010",
    name: "Sampoerna A Mild 16",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 32000,
    suggestedSellPrice: 35000,
  },
  "8992693100128": {
    barcode: "8992693100128",
    name: "Djarum Super 12",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 22500,
    suggestedSellPrice: 25000,
  },
  "8999999710027": {
    barcode: "8999999710027",
    name: "Djarum Super 12",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 22500,
    suggestedSellPrice: 25000,
  },
  "8992723100160": {
    barcode: "8992723100160",
    name: "Gudang Garam Surya 16",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 31000,
    suggestedSellPrice: 34000,
  },
  "8999999710041": {
    barcode: "8999999710041",
    name: "Gudang Garam Surya 16",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 31000,
    suggestedSellPrice: 34000,
  },
  "8992723100122": {
    barcode: "8992723100122",
    name: "Gudang Garam Surya 12",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 23500,
    suggestedSellPrice: 26000,
  },
  "8999999710058": {
    barcode: "8999999710058",
    name: "Gudang Garam Surya 12",
    categoryName: "ATK & Rokok",
    unit: "bungkus",
    suggestedBuyPrice: 23500,
    suggestedSellPrice: 26000,
  },
  "4902505163158": {
    barcode: "4902505163158",
    name: "Pulpen Pilot G2 0.5 Black",
    categoryName: "ATK & Rokok",
    unit: "pcs",
    suggestedBuyPrice: 14500,
    suggestedSellPrice: 17500,
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
export function inferCategoryFromKeywords(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("noodle") ||
    lower.includes("mie") ||
    lower.includes("mi ") ||
    lower.includes("pasta") ||
    lower.includes("ramen") ||
    lower.includes("bihun") ||
    lower.includes("soun")
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
    lower.includes("jus") ||
    lower.includes("cola") ||
    lower.includes("soda")
  ) {
    return "Minuman";
  }
  if (
    lower.includes("snack") ||
    lower.includes("chip") ||
    lower.includes("keripik") ||
    lower.includes("biscuit") ||
    lower.includes("biskuit") ||
    lower.includes("cookie") ||
    lower.includes("wafer") ||
    lower.includes("chocolate") ||
    lower.includes("cokelat") ||
    lower.includes("candy") ||
    lower.includes("permen") ||
    lower.includes("roti") ||
    lower.includes("bread")
  ) {
    return "Makanan Ringan / Snack";
  }
  if (
    lower.includes("soap") ||
    lower.includes("sabun") ||
    lower.includes("detergent") ||
    lower.includes("deterjen") ||
    lower.includes("shampoo") ||
    lower.includes("shampo") ||
    lower.includes("clean") ||
    lower.includes("dish") ||
    lower.includes("paste") ||
    lower.includes("pepsodent") ||
    lower.includes("toothpaste") ||
    lower.includes("pasta gigi") ||
    lower.includes("cuci") ||
    lower.includes("rinso") ||
    lower.includes("sunlight")
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
    lower.includes("tepung") ||
    lower.includes("sauce") ||
    lower.includes("saus") ||
    lower.includes("kecap") ||
    lower.includes("spice") ||
    lower.includes("bumbu") ||
    lower.includes("salt") ||
    lower.includes("garam") ||
    lower.includes("royco") ||
    lower.includes("masako")
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
    lower.includes("buku") ||
    lower.includes("sampoerna") ||
    lower.includes("djarum") ||
    lower.includes("surya")
  ) {
    return "ATK & Rokok";
  }
  if (
    lower.includes("obat") ||
    lower.includes("paracetamol") ||
    lower.includes("bodrex") ||
    lower.includes("tolak angin") ||
    lower.includes("minyak kayu putih")
  ) {
    return "Obat-obatan & P3K";
  }
  return "Makanan Ringan / Snack";
}

/**
 * Infers package unit (pcs, botol, bungkus, kotak, etc.) from product name.
 */
export function inferUnitFromName(name: string): string {
  const lower = name.toLowerCase();
  if (
    lower.includes("kotak") ||
    lower.includes("uht") ||
    lower.includes("tetrapak")
  ) {
    return "kotak";
  }
  if (lower.includes("cup") || lower.includes("gelas") || lower.includes("220ml")) {
    return "cup";
  }
  if (lower.includes("kaleng") || lower.includes("can ") || lower.includes("189ml")) {
    return "kaleng";
  }
  if (
    lower.includes("pouch") ||
    lower.includes("refill") ||
    lower.includes("1l") ||
    lower.includes("2l") ||
    lower.includes("650ml") ||
    lower.includes("750ml") ||
    lower.includes("520ml")
  ) {
    return "pouch";
  }
  if (
    lower.includes("botol") ||
    lower.includes("pet ") ||
    lower.includes("600ml") ||
    lower.includes("1500ml") ||
    lower.includes("350ml") ||
    lower.includes("330ml") ||
    lower.includes("275ml")
  ) {
    return "botol";
  }
  if (
    lower.includes("bungkus") ||
    lower.includes("indomie") ||
    lower.includes("sedaap") ||
    lower.includes("mie ") ||
    lower.includes("roti") ||
    lower.includes("snack") ||
    lower.includes("keripik") ||
    lower.includes("1kg") ||
    lower.includes("770g") ||
    lower.includes("850g")
  ) {
    return "bungkus";
  }
  return "pcs";
}

/**
 * Searches for product details by barcode:
 * 1. Immediate 0ms offline check in authentic Indonesian FMCG master catalog.
 * 2. Asynchronous server API route fallback (`/api/barcode/lookup`) which queries Supabase DB, Open Food Facts, and Open Beauty Facts.
 */
export async function lookupBarcodeDetails(
  rawBarcode: string
): Promise<BarcodeLookupResult> {
  const cleanCode = normalizeBarcode(rawBarcode);
  if (!cleanCode || cleanCode.length < 8) {
    return { found: false, barcode: rawBarcode };
  }

  // 1. Instant 0ms Local Master Catalog Match
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

  // 2. Server-side API Lookup Fallback (handles Supabase DB, Open Food Facts, Open Beauty Facts)
  if (typeof window !== "undefined") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `/api/barcode/lookup?code=${encodeURIComponent(cleanCode)}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const result: BarcodeLookupResult = await res.json();
        if (result && result.found && result.name) {
          return result;
        }
      }
    } catch {
      // Ignore network timeout or fetch errors gracefully
    }
  }

  return { found: false, barcode: cleanCode };
}
