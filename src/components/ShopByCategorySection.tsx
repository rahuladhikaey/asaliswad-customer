"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/lib/types";
import { getCategoryIcon } from "@/utils/categoryIcons";

const MAIN_CATEGORY_TABS = ["ALL", "GROCERY", "BAKERY", "SNACKS", "SPICES", "OILS & GHEE"];

export function ShopByCategorySection({ initialCategories = [] }: { initialCategories?: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedMainTab, setSelectedMainTab] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(initialCategories.length === 0);

  const fetchCategories = async () => {
    try {
      // 1. Check local storage cache first
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("asali_swad_categories_cache");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
              setCategories(parsed);
              setLoading(false);
            }
          } catch (e) {
            console.error("Local category cache parse error:", e);
          }
        }
      }

      // 2. Fetch fresh categories from real Supabase DB
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        setCategories(data as Category[]);
        if (typeof window !== "undefined") {
          localStorage.setItem("asali_swad_categories_cache", JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    // Supabase Realtime channel for instant category additions by Admin
    const channel = supabase
      .channel("customer-categories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => fetchCategories())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCategories = categories.filter((c) => {
    if (selectedMainTab === "ALL") return true;
    const mainCat = (c.main_category || "Grocery").toLowerCase();
    return mainCat === selectedMainTab.toLowerCase();
  });

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
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

      {/* Header & Main Category Selector Tabs (Blinkit Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-black text-slate-900 md:text-2xl">Shop by Category</h2>

        {/* Main Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {MAIN_CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedMainTab(tab)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                selectedMainTab.toLowerCase() === tab.toLowerCase()
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Coverflow */}
      <div className="coverflow-scroll-container no-scrollbar w-full overflow-x-auto pb-8 snap-x md:hidden">
        <div className="flex gap-x-4 sm:gap-x-6 w-max px-2 snap-start">
          {filteredCategories.map((category) => {
            const icon = getCategoryIcon(category.name);
            return (
              <Link 
                href={`/products?category=${category.id}`}
                key={category.id} 
                className="coverflow-item group/item relative flex flex-col items-center gap-2 sm:gap-3 cursor-pointer focus:outline-none w-[80px] sm:w-[95px]"
                style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
              >
                {/* Premium Circle */}
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-500 ease-out group-hover/item:border-emerald-400/60 group-hover/item:bg-emerald-50/50 group-hover/item:shadow-[0_20px_40px_-10px_rgb(16,185,129,0.3)] group-hover/item:-translate-y-2 group-hover/item:rotate-x-6 group-hover/item:-rotate-y-6">
                  <span className="text-3xl sm:text-4xl transition-transform duration-500 group-hover/item:scale-110 drop-shadow-sm relative z-10 flex items-center justify-center w-full h-full">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name} className="object-cover w-full h-full rounded-full" />
                    ) : icon.type === 'image' ? (
                      <Image src={icon.value} alt={category.name} width={44} height={44} className="object-contain w-9 h-9 sm:w-11 sm:h-11" />
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
        <div className="grid gap-6 px-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          {filteredCategories.map((category) => {
            const icon = getCategoryIcon(category.name);
            return (
              <Link 
                href={`/products?category=${category.id}`}
                key={category.id} 
                className="group/item relative flex flex-col items-center gap-2 sm:gap-3 cursor-pointer focus:outline-none w-full"
              >
                {/* Premium Circle */}
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-500 ease-out group-hover/item:border-emerald-400/60 group-hover/item:bg-emerald-50/50 group-hover/item:shadow-[0_20px_40px_-10px_rgb(16,185,129,0.3)] group-hover/item:-translate-y-2 group-hover/item:rotate-x-6 group-hover/item:-rotate-y-6">
                  <span className="text-3xl sm:text-4xl md:text-5xl transition-transform duration-500 group-hover/item:scale-110 drop-shadow-sm relative z-10 flex items-center justify-center w-full h-full">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name} className="object-cover w-full h-full rounded-full" />
                    ) : icon.type === 'image' ? (
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
  );
}
