"use client";

import * as React from "react";
import { Product, Category } from "@/types/database";
import { Search, QrCode, X, Package, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah, cn } from "@/lib/utils";
import { playBeep, playErrorSound } from "@/lib/audio";

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  onOpenScannerPairing: () => void;
  search: string;
  setSearch: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

export function ProductCatalog({
  products,
  categories,
  onSelectProduct,
  onOpenScannerPairing,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
}: ProductCatalogProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const pillsContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const isDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasMovedRef = React.useRef(false);

  // Mouse drag-to-scroll handlers for category pills
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Primary click only
    const container = pillsContainerRef.current;
    if (!container) return;

    isDownRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    hasMovedRef.current = false;
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDownRef.current || !pillsContainerRef.current) return;
      const x = e.pageX - pillsContainerRef.current.offsetLeft;
      const walk = (x - startXRef.current) * 1.25;

      if (Math.abs(x - startXRef.current) > 4) {
        hasMovedRef.current = true;
      }

      pillsContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
      if (!isDownRef.current) return;
      isDownRef.current = false;
      setIsDragging(false);
      // Delay reset so onClickCapture blocks accidental pill selection when drag finishes
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 80);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Direct wheel scroll horizontally without needing Shift key
  React.useEffect(() => {
    const container = pillsContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Keyboard shortcut F1 to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCardClick = (product: Product) => {
    if (product.current_stock <= 0) {
      playErrorSound();
      return;
    }
    playBeep();
    onSelectProduct(product);
  };

  return (
    <div className="flex flex-col h-auto lg:h-full space-y-3.5 select-none">
      {/* Top Search Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
          <Input
            ref={searchInputRef}
            placeholder="Cari nama barang atau scan barcode... (Tekan F1)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                e.preventDefault();
                const query = search.trim().toLowerCase();
                const exactMatch = products.find(
                  (p) =>
                    (p.barcode && p.barcode.toLowerCase() === query) ||
                    p.sku.toLowerCase() === query
                );
                if (exactMatch) {
                  handleCardClick(exactMatch);
                  setSearch("");
                } else if (products.length === 1) {
                  handleCardClick(products[0]);
                  setSearch("");
                }
              }
            }}
            className="pl-10 pr-9 h-11 text-xs md:text-sm rounded-xl bg-white border-[#E5E5E0] focus:border-[#6FA084]"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#1A1A1A] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Shortcut to pair wireless smartphone scanner */}
        <Button
          type="button"
          onClick={onOpenScannerPairing}
          className="h-11 px-3.5 gap-2 shrink-0 bg-white border border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5] rounded-xl font-bold text-xs"
          title="Hubungkan Pemindai Kamera HP"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">Scanner HP</span>
        </Button>
      </div>

      {/* Category Filter Chips Bar with Drag-to-Scroll */}
      <div
        ref={pillsContainerRef}
        onMouseDown={handleMouseDown}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (hasMovedRef.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        className={cn(
          "flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none touch-pan-x transition-colors",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all",
            isDragging ? "cursor-grabbing" : "cursor-pointer",
            selectedCategory === "all"
              ? "bg-[#6FA084] text-white shadow-xs"
              : "bg-white border border-[#E5E5E0] text-[#1A1A1A] hover:bg-[#F4F8F5]"
          )}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all",
              isDragging ? "cursor-grabbing" : "cursor-pointer",
              selectedCategory === cat.id
                ? "bg-[#6FA084] text-white shadow-xs"
                : "bg-white border border-[#E5E5E0] text-[#1A1A1A] hover:bg-[#F4F8F5]"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div className="max-h-[360px] sm:max-h-[460px] lg:max-h-none lg:flex-1 overflow-y-auto pr-1">
        {products.length === 0 ? (
          <div className="h-64 border border-dashed border-[#E5E5E0] rounded-2xl bg-white flex flex-col items-center justify-center p-6 text-center space-y-2">
            <Package className="w-10 h-10 text-[#D0D0CB]" />
            <p className="text-xs font-bold text-[#1A1A1A]">
              Tidak ada produk yang cocok
            </p>
            <p className="text-[11px] text-[#6B7280] max-w-xs">
              Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => {
              const isOutOfStock = product.current_stock <= 0;
              const isLowStock =
                product.current_stock > 0 &&
                product.current_stock <= (product.minimum_stock || 5);

              return (
                <div
                  key={product.id}
                  onClick={() => handleCardClick(product)}
                  className={cn(
                    "relative group bg-white border border-[#E5E5E0] rounded-xl p-3 flex flex-col justify-between text-left transition-all",
                    isOutOfStock
                      ? "opacity-60 cursor-not-allowed bg-[#FAFBF9]"
                      : "cursor-pointer hover:border-[#6FA084] hover:shadow-sm active:scale-[0.98]"
                  )}
                >
                  {/* Out of stock top ribbon badge */}
                  {isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-[#FDEAEA] text-[#D64545] border border-[#F8BEBE] text-[10px] font-black px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      HABIS
                    </div>
                  )}

                  {/* Product Visual / Icon */}
                  <div className="w-full h-24 rounded-lg bg-[#FAFBF9] border border-[#F0F0EB] flex items-center justify-center mb-2.5 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-[#6FA084]" />
                    )}
                  </div>

                    {/* Name & SKU / Barcode */}
                    <div className="space-y-0.5 mb-2">
                      <span className="font-bold text-xs text-[#1A1A1A] line-clamp-2 leading-tight">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-mono block truncate">
                        {product.barcode ? `${product.sku} • ${product.barcode}` : product.sku}
                      </span>
                    </div>

                  {/* Price & Stock Pill */}
                  <div className="pt-2 border-t border-[#F0F0EB] flex items-center justify-between gap-1">
                    <span className="text-xs md:text-sm font-black text-[#1A1A1A]">
                      {formatRupiah(product.sell_price)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
                        isOutOfStock
                          ? "bg-[#FDEAEA] text-[#D64545] border-[#F8BEBE]"
                          : isLowStock
                          ? "bg-[#FDF9F0] text-[#E8A838] border-[#F5D8A5]"
                          : "bg-[#F4F8F5] text-[#6FA084] border-[#D5E5DC]"
                      )}
                    >
                      {product.current_stock} {product.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
