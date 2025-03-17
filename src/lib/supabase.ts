import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  dimensions: string;
  price: number;
  image_url: string;
  category: string;
  created_at?: string;
}