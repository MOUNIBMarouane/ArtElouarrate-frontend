// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sbgckhadofvreemmbzhg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZ2NraGFkb2Z2cmVlbW1iemhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MDE1MTUsImV4cCI6MjA2NDI3NzUxNX0.qPa7-EjnOyONV8IHgYzEvP6b8oc7Z20yiHpt_LeMxEY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);