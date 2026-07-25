import Image from "next/image";
import Link from "next/link";
import { MobileSearch } from "@/components/MobileSearch";
import { Suspense } from "react";
export const dynamic = 'force-dynamic';
import { supabaseServer } from "@/lib/supabaseServer";
import { Product, Category } from "@/lib/types";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Header } from "@/components/Header";
import { MovingOfferBanner } from "@/components/MovingOfferBanner";
import { ShopByCategorySection } from "@/components/ShopByCategorySection";

const fetchHomeData = async (brandFilter: boolean = false) => {
  let categories: Category[] = [];
  let products: Product[] = [];

  try {
    const { data: catData } = await supabaseServer
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (catData && catData.length > 0) {
      categories = catData as Category[];
    }

    let query = supabaseServer
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (brandFilter) {
      query = query.eq('brand', 'asaliswad');
    }

    query = query.limit(20);

    const { data: prodData } = await query;
    if (prodData && prodData.length > 0) {
      products = prodData as Product[];
    }
  } catch (e) {
    console.error("Home data fetch notice:", e);
  }

  return {
    categories,
    products,
  };
};

export default async function HomePage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await props.searchParams;
  const brandFilter = resolvedParams?.brand === 'asaliswad';
  const { categories, products } = await fetchHomeData(brandFilter);

  return (
    <main className="min-h-screen bg-page text-slate-900 overflow-x-hidden">
      <Header title="Asali Swad" subtitle="Direct to your Door 📍" />
      
      <MovingOfferBanner />

      {/* Hero Section Container */}
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">

        {/* Story-like Banner Carousel */}
        <div className="pt-2">
          <BannerCarousel />
        </div>

        {/* Mobile Search - Focused Experience */}
        <div className="md:hidden">
          <Suspense fallback={<div className="h-[60px] w-full rounded-3xl bg-white/50 animate-pulse" />}>
            <MobileSearch />
          </Suspense>
        </div>

        {/* Real-time Shop by Category Section (Blinkit Style with Main Category Selector) */}
        <ShopByCategorySection initialCategories={categories} />

        {/* Featured Products Grid */}
        <section className="mt-10 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 md:text-2xl">Our Products</h2>
            <div className="h-0.5 flex-1 mx-4 bg-slate-100 hidden sm:block" />
            <Link href="/products" className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 transition-colors">Explorer</Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1920px]:grid-cols-6 lg:gap-6">
            {products.map((product) => {
              const effectiveMrp = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.25);
              const discountAmount = effectiveMrp - product.price;
              const discountPercent = Math.round((discountAmount / effectiveMrp) * 100);

              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white premium-shadow transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 border border-slate-100/50"
                >
                  {/* Image Holder */}
                  <Link href={`/products/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-slate-50 p-2 sm:p-4">
                    <Image
                      src={product.images?.[0] || product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
                    />
                    
                    {/* Discount Badge % */}
                    {discountPercent > 0 && (
                      <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-600/30">
                        {discountPercent}% OFF
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4 pt-4">
                    <Link href={`/products/${product.id}`} className="mb-auto">
                      <h3 className="line-clamp-2 text-sm font-bold leading-tight text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {product.brand || "Asali Swad"}
                      </p>
                    </Link>

                    <div className="mt-4 space-y-2">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-base font-black text-slate-900">₹{product.price}</span>
                          {effectiveMrp > product.price && (
                            <span className="text-[11px] font-bold text-slate-400 line-through font-mono">
                              ₹{effectiveMrp}
                            </span>
                          )}
                        </div>
                        
                        {discountAmount > 0 && (
                          <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-block w-fit mt-1">
                            Save ₹{discountAmount} ({discountPercent}% OFF)
                          </span>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <AddToCartButton product={product} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* See All Products Button */}
          <div className="mt-8 flex justify-center">
            <Link 
              href="/products" 
              className="group relative flex w-fit items-center gap-3 overflow-hidden rounded-2xl bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-900 premium-shadow transition-all hover:-translate-y-1 hover:bg-slate-900 hover:text-white active:scale-95 border border-slate-100 mx-auto"
            >
              <span>VIEW ALL CATALOG PRODUCTS</span>
              <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
