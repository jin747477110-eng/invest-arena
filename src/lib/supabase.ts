import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ynvqbbngmirvtmpnfepe.supabase.co";
const supabaseAnonKey = "sb_publishable_4Ch2vILw8eFcqEmbGoVYkQ_sZf6h_7-";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
