"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  product_type: string | null;
  cover_image_url: string | null;
  price: number | null;
  is_free: boolean;
};

interface ProductSearchProps {
  categoryId?: string;
}

export default function ProductSearch({ categoryId }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const searchProducts = async () => {
      const search = query.trim();

      if (!search) {
        setProducts([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      setSearched(true);

      try {
        // Single query declaration to avoid syntax/re-declaration errors
        let queryBuilder = supabase
          .from("products")
          .select(
            `
            id,
            title,
            short_description,
            description,
            product_type,
            cover_image_url,
            price,
            is_free
          `
          )
          .eq("is_published", true)
          .or(
            `title.ilike.%${search}%,short_description.ilike.%${search}%,description.ilike.%${search}%`
          );

        if (categoryId) {
          queryBuilder = queryBuilder.eq("category_id", categoryId);
        }

        const { data, error } = await queryBuilder.order("title");

        if (error) {
          console.error("Search error:", error.message);
          setProducts([]);
          return;
        }

        setProducts(data ?? []);
      } catch (error) {
        console.error("Unexpected search error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(searchProducts, 300);

    return () => clearTimeout(timeout);
  }, [query, categoryId]);

  return (
    <div className="relative w-full">
      {/* SEARCH INPUT */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن محتوى..."
          className="w-full rounded-2xl border border-[#d4af37]/40 bg-white/95 px-12 py-4 text-sm font-medium text-[#2c220f] shadow-md outline-none transition placeholder:text-[#8c6d31]/60 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30"
        />

        {/* SEARCH ICON */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-[#8c6d31]">
          🔍
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8c6d31]">
            جاري البحث...
          </div>
        )}
      </div>

      {/* RESULTS DROPDOWN */}
      {searched && (
        <div className="absolute right-0 top-full z-[999] mt-3 w-full overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-white p-2 shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="px-5 py-6 text-center text-sm font-medium text-[#8c6d31]">
              جاري البحث...
            </div>
          ) : products.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-bold text-[#2c220f]">لا توجد نتائج</p>
              <p className="mt-1 text-xs text-[#8c6d31]">
                جرّب البحث بكلمة مختلفة
              </p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#d4af37]/10">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={() => setQuery("")}
                  className="flex items-center gap-4 rounded-xl p-3.5 transition hover:bg-[#fbf7f0]"
                >
                  {/* THUMBNAIL */}
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[#d4af37]/20 bg-[#fbf7f0]">
                    {product.cover_image_url ? (
                      <img
                        src={product.cover_image_url}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] font-bold text-[#8c6d31]">
                        الحصالة
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[#2c220f]">
                      {product.title}
                    </h3>

                    {product.short_description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[#6e5422]">
                        {product.short_description}
                      </p>
                    )}

                    <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold text-[#8b6508]">
                      {product.product_type && (
                        <span>{product.product_type}</span>
                      )}

                      <span>•</span>

                      <span>
                        {product.is_free
                          ? "مجاني"
                          : `${product.price ?? 0} جنيه`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}