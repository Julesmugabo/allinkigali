/**
 * supabaseClient.js — Umuyoboro w'ibanze wo guhuza na Supabase (the one real
 * connection to the backend).
 *
 * Every future data/auth call in this app goes through this one client, the
 * same way every screen already only ever talks to a Context, never a raw
 * data source directly. That's what makes swapping the backend in later
 * (already true for News/Business/etc.) a contained job, not a rewrite.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('REPLACE_WITH')) {
  console.warn(
    'supabaseClient: EXPO_PUBLIC_SUPABASE_URL is not set in .env — Supabase calls will fail until it is.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
