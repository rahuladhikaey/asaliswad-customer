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
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      // 1. Check local cache first
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("asali_swad_categories_cache");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
              setCategories(parsed);
              setLoading(false);
            }
          } catch (e) {}
        }
      }

      // 2. Fetch live DB categories directly from Database B
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data) {
        setCategories(data as Category[]);
        if (typeof window !== "undefined") {
          localStorage.setItem("asali_swad_categories_cache", JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error("Error fetching categories from Database:", err);
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

      {/* Header & Main Taxonomy Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Shop by Category
        </h2>

        {/* Main Taxonomy Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {MAIN_CATEGORY_TABS.map((tab) => {
            const isActive = selectedMainTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedMainTab(tab)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all uppercase whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Display */}
      {loading && categories.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-xs font-bold text-slate-500">No categories found in database.</p>
          <p className="text-[11px] text-slate-400 mt-1">Categories created by Admin will appear here automatically.</p>
        </div>
      ) : (
        <div className="coverflow-scroll-container flex sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-x-auto pb-6 pt-2 px-1 no-scrollbar perspective-1000">
          {filteredCategories.map((cat) => {
            const imageSrc = cat.image_url || null;
            const iconSymbol = cat.icon || getCategoryIcon(cat.name);

            return (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="coverflow-item group flex-shrink-0 w-28 sm:w-auto scroll-snap-align-center flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-1.5"
              >
                {/* Blinkit-Style Square / Circular Image Container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border border-slate-100 shadow-md group-hover:shadow-xl group-hover:border-emerald-500/30 flex items-center justify-center overflow-hidden transition-all p-2">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={cat.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl transform group-hover:scale-125 transition-transform duration-300 select-none">
                      {iconSymbol}
                    </span>
                  )}
                </div>

                <span className="mt-2.5 text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-emerald-700 line-clamp-2 uppercase tracking-wide px-1">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
