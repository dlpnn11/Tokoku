import { supabase } from "@/lib/supabase";
import { Product, Category, Supplier } from "@/types/database";
import { sanitizePostgrestFilter, validateNonNegative, getSafeErrorMessage } from "@/lib/security";
import {
  ProductInputSchema,
  SupplierInputSchema,
  CategoryInputSchema,
  StockAdjustmentSchema,
  formatZodError,
} from "@/lib/schemas";

export interface InventoryStats {
  totalSku: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuation: number;
}

export const inventoryService = {
  // 1. Get Products with joined category & supplier
  async getProducts(filter?: {
    search?: string;
    categoryId?: string;
    status?: string;
  }) {
    let query = supabase
      .from("products")
      .select("*, category:categories(*), supplier:suppliers(*)")
      .order("created_at", { ascending: false });

    if (filter?.search) {
      const safeSearch = sanitizePostgrestFilter(filter.search);
      if (safeSearch) {
        query = query.or(
          `name.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%,barcode.ilike.%${safeSearch}%`
        );
      }
    }

    if (filter?.categoryId && filter.categoryId !== "all") {
      query = query.eq("category_id", filter.categoryId);
    }

    if (filter?.status && filter.status !== "all") {
      if (filter.status === "aktif") {
        query = query.eq("is_active", true);
      } else if (filter.status === "non-aktif") {
        query = query.eq("is_active", false);
      } else if (filter.status === "menipis") {
        query = query.lte("current_stock", 5).gt("current_stock", 0);
      } else if (filter.status === "habis") {
        query = query.eq("current_stock", 0);
      }
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat produk inventaris.",
          context: "getProducts",
        })
      );
    }
    return (data || []) as Product[];
  },

  // 2. Get Categories with product count
  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*, products(id)")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat kategori produk.",
          context: "getCategories",
        })
      );
    }

    return (data || []).map((cat: any) => ({
      ...cat,
      product_count: Array.isArray(cat.products) ? cat.products.length : 0,
    })) as (Category & { product_count: number })[];
  },

  // 3. Get Suppliers with product count
  async getSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*, products(id)")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat supplier mitra.",
          context: "getSuppliers",
        })
      );
    }

    return (data || []).map((sup: any) => ({
      ...sup,
      product_count: Array.isArray(sup.products) ? sup.products.length : 0,
    })) as (Supplier & { product_count: number })[];
  },

  // 4. Get Inventory Statistics
  async getStats(): Promise<InventoryStats> {
    const { data, error } = await supabase
      .from("products")
      .select("buy_price, current_stock, minimum_stock, is_active");

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat statistik inventaris.",
          context: "getStats",
        })
      );
    }

    const items = data || [];
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((item) => {
      totalValuation += Number(item.buy_price || 0) * Number(item.current_stock || 0);
      if (item.current_stock === 0) {
        outOfStockCount++;
      } else if (item.current_stock <= (item.minimum_stock || 5)) {
        lowStockCount++;
      }
    });

    return {
      totalSku: items.length,
      lowStockCount,
      outOfStockCount,
      totalValuation,
    };
  },

  // 5. Create Product (Zod validated)
  async createProduct(productData: Omit<Product, "id" | "created_at" | "category" | "supplier">) {
    const parseResult = ProductInputSchema.safeParse(productData);
    if (!parseResult.success) {
      throw new Error(`Validasi produk gagal: ${formatZodError(parseResult.error)}`);
    }

    const { data, error } = await supabase
      .from("products")
      .insert([parseResult.data])
      .select("*, category:categories(*), supplier:suppliers(*)")
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menambahkan produk baru.",
          context: "createProduct",
        })
      );
    }
    return data as Product;
  },

  // 6. Update Product (Zod validated)
  async updateProduct(id: string, productData: Partial<Product>) {
    if (!id || typeof id !== "string") {
      throw new Error("ID produk tidak valid");
    }
    const parseResult = ProductInputSchema.partial().safeParse(productData);
    if (!parseResult.success) {
      throw new Error(`Validasi update produk gagal: ${formatZodError(parseResult.error)}`);
    }

    const { data, error } = await supabase
      .from("products")
      .update(parseResult.data)
      .eq("id", id)
      .select("*, category:categories(*), supplier:suppliers(*)")
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memperbarui data produk.",
          context: "updateProduct",
        })
      );
    }
    return data as Product;
  },

  // 7. Delete Product
  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menghapus produk.",
          context: "deleteProduct",
        })
      );
    }
    return true;
  },

  // 8. Create Category (Zod validated)
  async createCategory(name: string, icon_name?: string) {
    const parseResult = CategoryInputSchema.safeParse({ name, icon_name });
    if (!parseResult.success) {
      throw new Error(`Validasi kategori gagal: ${formatZodError(parseResult.error)}`);
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([parseResult.data])
      .select()
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menambahkan kategori.",
          context: "createCategory",
        })
      );
    }
    return data as Category;
  },

  // 8B. Update Category (Zod validated)
  async updateCategory(id: string, name: string) {
    const parseResult = CategoryInputSchema.shape.name.safeParse(name);
    if (!parseResult.success) {
      throw new Error(`Validasi nama kategori gagal: ${formatZodError(parseResult.error)}`);
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ name: parseResult.data })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memperbarui kategori.",
          context: "updateCategory",
        })
      );
    }
    return data as Category;
  },

  // 9. Delete Category
  async deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menghapus kategori.",
          context: "deleteCategory",
        })
      );
    }
    return true;
  },

  // 10. Create Supplier (Zod validated)
  async createSupplier(supplierData: { name: string; phone?: string; address?: string }) {
    const parseResult = SupplierInputSchema.safeParse(supplierData);
    if (!parseResult.success) {
      throw new Error(`Validasi supplier gagal: ${formatZodError(parseResult.error)}`);
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert([parseResult.data])
      .select()
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menambahkan data supplier.",
          context: "createSupplier",
        })
      );
    }
    return data as Supplier;
  },

  async createSupplierWithProducts(
    supplierData: { name: string; phone?: string; address?: string },
    productIds: string[]
  ) {
    const supplier = await this.createSupplier(supplierData);
    if (productIds.length > 0) {
      await this.assignProductsToSupplier(supplier.id, productIds);
    }
    return supplier;
  },

  // 10B. Update Supplier (Zod validated)
  async updateSupplier(
    id: string,
    supplierData: { name: string; phone?: string; address?: string }
  ) {
    if (!id || typeof id !== "string") {
      throw new Error("ID supplier tidak valid");
    }
    const parseResult = SupplierInputSchema.partial().safeParse(supplierData);
    if (!parseResult.success) {
      throw new Error(`Validasi update supplier gagal: ${formatZodError(parseResult.error)}`);
    }

    const { data, error } = await supabase
      .from("suppliers")
      .update(parseResult.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memperbarui data supplier.",
          context: "updateSupplier",
        })
      );
    }
    return data as Supplier;
  },

  async updateSupplierWithProducts(
    id: string,
    supplierData: { name: string; phone?: string; address?: string },
    productIds: string[]
  ) {
    const supplier = await this.updateSupplier(id, supplierData);
    const currentProducts = await this.getProductsBySupplier(id);
    const toUnlink = currentProducts.filter((p) => !productIds.includes(p.id));
    for (const p of toUnlink) {
      await this.removeProductFromSupplier(p.id);
    }
    if (productIds.length > 0) {
      await this.assignProductsToSupplier(id, productIds);
    }
    return supplier;
  },

  // 11. Delete Supplier
  async deleteSupplier(id: string) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menghapus supplier.",
          context: "deleteSupplier",
        })
      );
    }
    return true;
  },

  // 12. Supplier Product Relationship Helpers
  async getProductsBySupplier(supplierId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("supplier_id", supplierId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat produk supplier.",
          context: "getProductsBySupplier",
        })
      );
    }
    return (data || []) as Product[];
  },

  async assignProductsToSupplier(supplierId: string, productIds: string[]) {
    if (productIds.length === 0) return;
    const { error } = await supabase
      .from("products")
      .update({ supplier_id: supplierId })
      .in("id", productIds);

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal menghubungkan produk ke supplier.",
          context: "assignProductsToSupplier",
        })
      );
    }
  },

  async removeProductFromSupplier(productId: string) {
    const { error } = await supabase
      .from("products")
      .update({ supplier_id: null })
      .eq("id", productId);

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal melepaskan kaitan supplier pada produk.",
          context: "removeProductFromSupplier",
        })
      );
    }
  },

  // 13. Category Products Helper
  async getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), supplier:suppliers(*)")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memuat produk kategori.",
          context: "getProductsByCategory",
        })
      );
    }
    return (data || []) as Product[];
  },

  // 14. Stock Opname / Direct Stock Adjustment (Atomic Row-Locked & Zod Validated)
  async adjustStock(productId: string, newStock: number) {
    const parseResult = StockAdjustmentSchema.safeParse({ productId, newStock });
    if (!parseResult.success) {
      throw new Error(`Validasi stok opname gagal: ${formatZodError(parseResult.error)}`);
    }
    const { productId: pId, newStock: validStock } = parseResult.data;

    // 1. Try atomic row-locked stored function
    try {
      const { data, error } = await supabase.rpc("set_product_stock_atomic", {
        p_product_id: pId,
        p_new_stock: validStock,
      });

      if (!error && data?.product) {
        return data.product as Product;
      }
    } catch {
      // Fallback below
    }

    // 2. Direct atomic update fallback
    const { data, error } = await supabase
      .from("products")
      .update({ current_stock: validStock })
      .eq("id", pId)
      .select()
      .single();

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memperbarui stok produk.",
          context: "adjustStock",
        })
      );
    }
    return data as Product;
  },

  // 15. Atomic Delta Stock Adjustment (Restock / Scrap / Return)
  async adjustStockDelta(productId: string, delta: number) {
    const { data, error } = await supabase.rpc("adjust_product_stock_delta", {
      p_product_id: productId,
      p_delta: delta,
    });

    if (error) {
      throw new Error(
        getSafeErrorMessage(error, {
          fallbackMessage: "Gagal memperbarui delta stok produk.",
          context: "adjustStockDelta",
        })
      );
    }

    return data as {
      success: boolean;
      product_id: string;
      old_stock: number;
      new_stock: number;
      product: Product;
    };
  },
};
