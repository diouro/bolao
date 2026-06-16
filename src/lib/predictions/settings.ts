import {
  DEFAULT_PREDICTION_LOCK_MINUTES,
  normalizePredictionLockMinutes,
} from "@/lib/predictions/lock";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPredictionLockMinutes() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "prediction_lock_minutes")
    .maybeSingle();

  if (error) {
    return DEFAULT_PREDICTION_LOCK_MINUTES;
  }

  return normalizePredictionLockMinutes(data?.value);
}
