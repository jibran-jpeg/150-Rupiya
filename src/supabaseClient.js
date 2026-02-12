import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase URL or Anon Key. Please check your .env file.')
    // Mock client to prevent app crash
    supabaseInstance = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: { message: 'Supabase keys missing. Check console.' } }),
                    order: async () => ({ data: [], error: { message: 'Supabase keys missing.' } })
                }),
                order: async () => ({ data: [], error: { message: 'Supabase keys missing.' } })
            }),
            insert: () => ({
                select: () => ({
                    single: async () => ({ data: null, error: { message: 'Supabase keys missing.' } })
                })
            })
        })
    }
} else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseInstance

