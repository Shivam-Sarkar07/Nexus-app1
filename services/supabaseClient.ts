
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project details
// If these are missing, the app will fall back to local storage simulation where possible, 
// but Auth features (Change Password) require a valid backend.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
