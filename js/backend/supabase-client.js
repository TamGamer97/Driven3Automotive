(function initSupabaseClient() {
  let client = null;

  function getSupabaseGlobal() {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase SDK not loaded. Include @supabase/supabase-js before backend scripts.');
    }
    return window.supabase;
  }

  function getClient() {
    if (client) return client;
    const supabase = getSupabaseGlobal();
    client = supabase.createClient(
      window.D3SupabaseConfig.url,
      window.D3SupabaseConfig.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
    return client;
  }

  function setConnection(url, publishableKey) {
    if (typeof url === 'string' && url.trim()) {
      window.D3SupabaseConfig.url = url.trim();
      localStorage.setItem('d3.supabase.url', window.D3SupabaseConfig.url);
    }
    if (typeof publishableKey === 'string' && publishableKey.trim()) {
      window.D3SupabaseConfig.publishableKey = publishableKey.trim();
      localStorage.setItem('d3.supabase.publishableKey', window.D3SupabaseConfig.publishableKey);
    }
    client = null;
  }

  window.D3Supabase = {
    getClient,
    setConnection,
  };
})();
