import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Database} from '@/types';

// Supabase configuration - replace with your actual values
const supabaseUrl = 'https://zvnlsbtjiwptavoxqaew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2bmxzYnRqaXdwdGF2b3hxYWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3ODM4MTIsImV4cCI6MjA1MjM1OTgxMn0.kwPt4MX3TKWmwGXNHqSdJQ2OKi6oTGj8M_CrXaG9T3M';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  CONVERSATION_SCREENSHOTS: 'conversation-screenshots',
  VOICE_RECORDINGS: 'voice-recordings',
} as const;

// Edge function names
export const EDGE_FUNCTIONS = {
  PHOTO_ANALYSIS: 'photo-analysis',
  CONVERSATION_ANALYSIS: 'conversation-analysis',
  VOICE_ANALYSIS: 'voice-analysis',
  CREATE_SUBSCRIPTION: 'create-subscription',
} as const;

// Helper function to upload file to Supabase storage
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: Blob | File,
): Promise<{data?: {path: string}; error?: Error}> {
  try {
    const {data, error} = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return {data};
  } catch (error) {
    return {error: error as Error};
  }
}

// Helper function to get public URL for uploaded file
export function getPublicUrl(bucket: string, filePath: string): string {
  const {data} = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// Helper function to call edge functions
export async function callEdgeFunction<T = any>(
  functionName: string,
  data: any,
): Promise<{data?: T; error?: Error}> {
  try {
    const {data: result, error} = await supabase.functions.invoke(
      functionName,
      {
        body: data,
      },
    );

    if (error) throw error;
    return {data: result};
  } catch (error) {
    return {error: error as Error};
  }
}