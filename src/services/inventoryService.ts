import { supabase } from "@/lib/supabase";
import { Product, Category, Supplier } from "@/types/database";

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
      query = query.or(
        `name.ilike.%${filter.search}%,sku.ilike.%${filter.search}%,barcode.ilike.%${filter.search}%`
      );
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
    if (error) throw error;
    return (data || []) as Product[];
  },

  // 2. Get Categories with product count
  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*, products(id)")
      .order("name", { ascending: true });

    if (error) throw error;

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

    if (error) throw error;

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

    if (error) throw error;

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

  // 5. Create Product
  async createProduct(productData: Omit<Product, "id" | "created_at" | "category" | "supplier">) {
    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select("*, category:categories(*), supplier:suppliers(*)")
      .single();

    if (error) throw error;
    return data as Product;
  },

  // 6. Update Product
  async updateProduct(id: string, productData: Partial<Product>) {
    const { data, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select("*, category:categories(*), supplier:suppliers(*)")
      .single();

    if (error) throw error;
    return data as Product;
  },

  // 7. Delete Product
  async deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // 8. Create Category
  async createCategory(name: string, icon_name?: string) {
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, icon_name: icon_name || "Package" }])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  // 8B. Update Category
  async updateCategory(id: string, name: string) {
    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  // 9. Delete Category
  async deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // 10. Create Supplier (with optional product assignment)
  async createSupplier(supplierData: { name: string; phone?: string; address?: string }) {
    const { data, error } = await supabase
      .from("suppliers")
      .insert([supplierData])
      .select()
      .single();

    if (error) throw error;
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

  // 10B. Update Supplier
  async updateSupplier(
    id: string,
    supplierData: { name: string; phone?: string; address?: string }
  ) {
    const { data, error } = await supabase
      .from("suppliers")
      .update(supplierData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
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
    if (error) throw error;
    return true;
  },

  // 12. Supplier Product Relationship Helpers
  async getProductsBySupplier(supplierId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("supplier_id", supplierId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Product[];
  },

  async assignProductsToSupplier(supplierId: string, productIds: string[]) {
    if (productIds.length === 0) return;
    const { error } = await supabase
      .from("products")
      .update({ supplier_id: supplierId })
      .in("id", productIds);

    if (error) throw error;
  },

  async removeProductFromSupplier(productId: string) {
    const { error } = await supabase
      .from("products")
      .update({ supplier_id: null })
      .eq("id", productId);

    if (error) throw error;
  },

  // 13. Category Products Helper
  async getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), supplier:suppliers(*)")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Product[];
  },

  // 14. Stock Opname / Direct Stock Adjustment
  async adjustStock(productId: string, newStock: number) {
    const { data, error } = await supabase
      .from("products")
      .update({ current_stock: newStock })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },
};
