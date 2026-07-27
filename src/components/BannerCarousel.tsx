"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_BANNERS = [
  { id: 1, src: "/1stbann.png", alt: "Welcome Our Asali Swad Products" },
  { id: 2, src: "/2ndbann.png", alt: "Cooked Vegetables With Asali Swad" },
  { id: 3, src: "/3rdbann.png", alt: "Welcome to our Asali Swad About" },
  { id: 4, src: "/4thbann.png", alt: "Chola Motor Fry Dal Bori - Authentic Taste" },
  { id: 5, src: "/5thbann.png", alt: "Asali Swad - Authentic Products, No Milawat - New Beginning Big Dreams" },
];

export function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState(DEFAULT_BANNERS);

  useEffect(() => {
    // Load admin-configured banners from store_settings DB
    const fetchBanners = async () => {
      try {
        const { data } = await supabase
          .from("store_settings")
          .select("value")
          .eq("key", "hero_banners")
          .single();

        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
          setBanners(data.value);
        }
      } catch (err) {
        // Fallback to default banners silently
      }
    };
    fetchBanners();

    // Realtime subscription — Admin updates banners → customer sees them instantly
    const channel = supabase
      .channel("banner-carousel-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings", filter: "key=eq.hero_banners" }, (payload) => {
        const value = (payload.new as any)?.value;
        if (value && Array.isArray(value) && value.length > 0) {
          setBanners(value);
          setCurrentIndex(0);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative mt-4 w-full overflow-hidden rounded-[2rem] bg-slate-100 shadow-xl shadow-slate-200/50 group">
      {/* Banner Container with dynamic height to show the exact real size of banners */}
      <div className="relative w-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`w-full transition-all duration-1000 ease-out ${index === currentIndex
              ? "opacity-100 z-10 scale-100 relative"
              : "opacity-0 z-0 pointer-events-none scale-95 absolute inset-0"
              }`}
          >
            <Image
              src={banner.src}
              alt={banner.alt}
              width={1920}
              height={800}
              priority={index === 0}
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="w-full h-auto object-cover rounded-[2rem] shadow-sm"
              unoptimized
            />
            {/* Subtle overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none rounded-[2rem]" />
          </div>
        ))}
      </div>

      {/* Modern Progress Line Navigation */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 px-4 w-full max-w-[200px]">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="group/dot relative h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur-sm transition-all"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={`absolute inset-0 bg-white transition-all duration-[4500ms] ease-linear ${index === currentIndex ? "w-full" : "w-0"}`}
              style={{ transitionDuration: index === currentIndex ? '4500ms' : '0ms' }}
            />
          </button>
        ))}
      </div>

      {/* Navigation Arrows (Visible on Hover/Desktop) */}
      <button
        onClick={() => setCurrentIndex((currentIndex - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md opacity-0 transition-all hover:bg-white/40 group-hover:opacity-100 hidden md:flex"
      >
        ←
      </button>
      <button
        onClick={() => setCurrentIndex((currentIndex + 1) % banners.length)}
        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md opacity-0 transition-all hover:bg-white/40 group-hover:opacity-100 hidden md:flex"
      >
        →
      </button>
    </div>
  );
}
