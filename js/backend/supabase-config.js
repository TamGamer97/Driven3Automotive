(function initSupabaseConfig() {
  const savedUrl = localStorage.getItem('d3.supabase.url');
  const savedKey = localStorage.getItem('d3.supabase.publishableKey');

  window.D3SupabaseConfig = {
    url: savedUrl || 'https://oawzxijcucoudwktwpmr.supabase.co',
    publishableKey: savedKey || 'sb_publishable_ao8bH2_BwuII2EWrk9Hpgg_U1NZN43g',
    listingsTable: 'listings',
  };
})();
