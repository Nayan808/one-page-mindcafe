// Supabase's SDK throws synchronously if the URL isn't well-formed, which
// would crash the page when NEXT_PUBLIC_SUPABASE_URL is blank. Falling back
// to a syntactically valid placeholder lets client creation succeed; the
// actual network calls then fail with a normal fetch error instead of a
// crash.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
