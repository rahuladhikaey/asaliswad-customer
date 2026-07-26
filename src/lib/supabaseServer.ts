import { createClient } from "@supabase/supabase-js";

// Customer Application reads directly from Master DB (qgiichnytbukisofuqiv.supabase.co)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_B_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_A_URL || "https://qgiichnytbukisofuqiv.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_B_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_kMnEF2aqyz1z2SOB-sxtCQ_s4J-VisB";

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
