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
import { getCategoryIcon } from "@/utils/categoryIcons";

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "Spices & Masala" },
  { id: 2, name: "Handmade Bori" },
  { id: 3, name: "Pulses & Dals" },
  { id: 4, name: "Pure Oils & Ghee" },
  { id: 5, name: "Rice & Grains" },
  { id: 6, name: "Pickles & Chutney" },
  { id: 7, name: "Sweets & Snacks" },
  { id: 8, name: "Organic Specials" }
];

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
    } else {
      categories = DEFAULT_CATEGORIES;
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
    categories = DEFAULT_CATEGORIES;
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

        {/* Categories Section */}
        <section className="mt-10">
          <style dangerouslySetInnerHTML={{ __html: `
            @media (max-width: 767px) {
              .coverflow-scroll-container {
                scroll-snap-type: x mandatory;
              }
              @supports (animation-timeline: view()) {
                .coverflow-item {
                  view-timeline-name: --item-timeline;
                  view-timeline-axis: inline;
                  animation: coverflow linear both;
                  animation-timeline: --item-timeline;
                }
                @keyframes coverflow {
                  0% { transform: rotateY(40deg) scale(0.85) translateZ(-50px); opacity: 0.6; }
                  50% { transform: rotateY(0deg) scale(1) translateZ(0px); opacity: 1; z-index: 10; }
                  100% { transform: rotateY(-40deg) scale(0.85) translateZ(-50px); opacity: 0.6; }
                }
              }
            }
          `}} />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-slate-900 md:text-2xl">Shop by Category</h2>
          </div>

          {/* Mobile Coverflow */}
          <div className="coverflow-scroll-container no-scrollbar w-full overflow-x-auto pb-8 snap-x md:hidden">
            <div className="flex gap-x-4 sm:gap-x-6 w-max px-2 snap-start">
              {categories.map((category) => {
                const icon = getCategoryIcon(category.name);
                return (
                  <Link 
                    href={`/products?category=${category.id}`}
                    key={category.id} 
                    className="coverflow-item group/item relative flex flex-col items-center gap-2 sm:gap-3 cursor-pointer focus:outline-none w-[75px] sm:w-[90px]"
                    style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
                  >
                    {/* Premium Circle */}
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-500 ease-out group-hover/item:border-emerald-400/60 group-hover/item:bg-emerald-50/50 group-hover/item:shadow-[0_20px_40px_-10px_rgb(16,185,129,0.3)] group-hover/item:-translate-y-2 group-hover/item:rotate-x-6 group-hover/item:-rotate-y-6">
                      <span className="text-3xl sm:text-4xl transition-transform duration-500 group-hover/item:scale-110 drop-shadow-sm relative z-10 flex items-center justify-center">
                        {icon.type === 'image' ? (
                          <Image src={icon.value} alt={category.name} width={40} height={40} className="object-contain w-8 h-8 sm:w-10 sm:h-10" />
                        ) : (
                          icon.value
                        )}
                      </span>
                      
                      {/* Glossy overlay reflection on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none" />
                    </div>
                    <span className="w-full text-center text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700 group-hover/item:text-emerald-700 transition-colors duration-500 line-clamp-2">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Responsive Grid */}
          <div className="hidden md:block w-full">
            <div className="grid gap-6 px-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {categories.map((category) => {
                const icon = getCategoryIcon(category.name);
                return (
                  <Link 
                    href={`/products?category=${category.id}`}
                    key={category.id} 
                    className="group/item relative flex flex-col items-center gap-2 sm:gap-3 cursor-pointer focus:outline-none w-full"
                  >
                    {/* Premium Circle */}
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-500 ease-out group-hover/item:border-emerald-400/60 group-hover/item:bg-emerald-50/50 group-hover/item:shadow-[0_20px_40px_-10px_rgb(16,185,129,0.3)] group-hover/item:-translate-y-2 group-hover/item:rotate-x-6 group-hover/item:-rotate-y-6">
                      <span className="text-3xl sm:text-4xl md:text-5xl transition-transform duration-500 group-hover/item:scale-110 drop-shadow-sm relative z-10 flex items-center justify-center">
                        {icon.type === 'image' ? (
                          <Image src={icon.value} alt={category.name} width={56} height={56} className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
                        ) : (
                          icon.value
                        )}
                      </span>
                      
                      {/* Glossy overlay reflection on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none" />
                    </div>
                    <span className="w-full text-center text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-wider text-slate-700 group-hover/item:text-emerald-700 transition-colors duration-500 line-clamp-2">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

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
