"use client";

import { ChefHat, Leaf, BadgeCheck, Truck, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_ITEMS = [
  { icon: "chef", text: "Curated by Top-Rated Chefs" },
  { icon: "leaf", text: "Made Fresh • Delivered Fast" },
  { icon: "badge", text: "Premium Quality" },
];

const iconMap: Record<string, React.ReactNode> = {
  chef: <ChefHat className="w-5 h-5 text-emerald-100" />,
  leaf: <Leaf className="w-5 h-5 text-emerald-100" />,
  badge: <BadgeCheck className="w-5 h-5 text-emerald-100" />,
  truck: <Truck className="w-5 h-5 text-emerald-100" />,
  tag: <Tag className="w-5 h-5 text-emerald-100" />,
};

export function MovingOfferBanner() {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    // Load admin-configured marquee text from store_settings DB
    const fetchMarquee = async () => {
      try {
        const { data } = await supabase
          .from("store_settings")
          .select("value")
          .eq("key", "marquee_banner")
          .single();

        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
          setItems(data.value);
        }
      } catch (err) {
        // Fallback to default items silently
      }
    };
    fetchMarquee();

    // Realtime subscription — Admin updates marquee → customer sees instantly
    const channel = supabase
      .channel("marquee-banner-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings", filter: "key=eq.marquee_banner" }, (payload) => {
        const value = (payload.new as any)?.value;
        if (value && Array.isArray(value) && value.length > 0) {
          setItems(value);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const BannerContent = () => (
    <div className="flex items-center justify-around w-full shrink-0">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {iconMap[item.icon] || <BadgeCheck className="w-5 h-5 text-emerald-100" />}
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full overflow-hidden bg-[#0a662e] text-white py-2.5 flex items-center shadow-inner relative z-10 border-b border-[#085225]">
      <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap items-center w-[200%]">
        <BannerContent />
        <BannerContent />
      </div>
    </div>
  );
}
