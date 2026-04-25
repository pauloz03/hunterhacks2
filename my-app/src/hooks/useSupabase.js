import { useMemo } from "react";
import { supabase } from "../lib/supabase";

export function useSupabase() {
  return useMemo(() => supabase, []);
}
