"server-only";

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    realtime: {
      transport: ws,
    },
  }
);