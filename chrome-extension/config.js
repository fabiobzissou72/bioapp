// Shared config across popup/background/content-script.
// Classic scripts (not ES modules) so it can be loaded via <script> and
// importScripts() without a bundler — this sets a global.
self.BIOINSTA_CONFIG = {
  API_BASE: "https://minhabioapp.vercel.app",
  SUPABASE_URL: "https://psdllonqhxotobknnhog.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZGxsb25xaHhvdG9ia25uaG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4ODA0MjYsImV4cCI6MjEwMTQ1NjQyNn0.ftiJcxAf9lM-_vfzjaBJ97Hnmv7qZM_cfmZhxGqXU_A",
};
