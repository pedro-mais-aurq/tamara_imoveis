// supabase/supabaseClient.js
// Cliente público do Supabase para uso no navegador.
// Use apenas a publishable key ou anon public key. Nunca use service_role aqui.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rlkiydzqpgxcwhcwlpug.supabase.co";
const SUPABASE_KEY = "sb_publishable_q3YeAdG1iNCh86-Hynd60g_Su_PXlHL";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);