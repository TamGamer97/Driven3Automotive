(function initListingsApi() {
  let adminSessionToken = null;

  function getSupabase() {
    return window.D3Supabase.getClient();
  }

  function toNum(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeListing(record) {
    return {
      id: record.id,
      make: record.make || '',
      model: record.model || '',
      variant: record.variant || '',
      year: toNum(record.year, 0),
      miles: record.miles || '',
      fuel: record.fuel || '',
      trans: record.trans || '',
      price: toNum(record.price, 0),
      body: (record.body || '').toLowerCase(),
      img: record.img || '',
      badge: record.badge || '',
      color: record.color || '',
      doors: toNum(record.doors, 0),
      seats: toNum(record.seats, 0),
      engine: record.engine || '',
      power: record.power || '',
      torque: record.torque || '',
      co2: record.co2 || '',
      reg: record.reg || '',
      owners: toNum(record.owners, 0),
      mot: record.mot || '',
      serviceHistory: record.service_history || record.serviceHistory || '',
      description: record.description || '',
      features: safeArray(record.features),
      imgs: safeArray(record.imgs),
      status: record.status || 'active',
      featured: record.featured || 'no',
    };
  }

  function toPayload(listing) {
    return {
      make: listing.make || '',
      model: listing.model || '',
      variant: listing.variant || '',
      year: toNum(listing.year, 0),
      miles: listing.miles || '',
      fuel: listing.fuel || '',
      trans: listing.trans || '',
      price: toNum(listing.price, 0),
      body: (listing.body || '').toLowerCase(),
      img: listing.img || '',
      badge: listing.badge || '',
      color: listing.color || '',
      doors: toNum(listing.doors, 0),
      seats: toNum(listing.seats, 0),
      engine: listing.engine || '',
      power: listing.power || '',
      torque: listing.torque || '',
      co2: listing.co2 || '',
      reg: listing.reg || '',
      owners: toNum(listing.owners, 0),
      mot: listing.mot || '',
      service_history: listing.serviceHistory || '',
      description: listing.description || '',
      features: safeArray(listing.features),
      imgs: safeArray(listing.imgs),
      status: listing.status || 'active',
      featured: listing.featured || 'no',
    };
  }

  async function fetchPublicListings() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(window.D3SupabaseConfig.listingsTable)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeListing);
  }

  async function fetchAllListings() {
    if (!adminSessionToken) {
      throw new Error('Not authenticated as admin');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_listings', {
      p_token: adminSessionToken,
    });
    if (error) throw error;
    return (data || []).map(normalizeListing);
  }

  async function fetchListingById(id) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(window.D3SupabaseConfig.listingsTable)
      .select('*')
      .eq('id', String(id))
      .single();
    if (error) throw error;
    return normalizeListing(data);
  }

  async function createListing(listing) {
    if (!adminSessionToken) {
      throw new Error('Not authenticated as admin');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_create_listing', {
      p_token: adminSessionToken,
      p_data: toPayload(listing),
    });
    if (error) throw error;
    return normalizeListing(data);
  }

  async function updateListing(id, listing) {
    if (!adminSessionToken) {
      throw new Error('Not authenticated as admin');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_update_listing', {
      p_token: adminSessionToken,
      p_id: String(id),
      p_data: toPayload(listing),
    });
    if (error) throw error;
    return normalizeListing(data);
  }

  async function deleteListing(id) {
    if (!adminSessionToken) {
      throw new Error('Not authenticated as admin');
    }

    const supabase = getSupabase();
    const { error } = await supabase.rpc('admin_delete_listing', {
      p_token: adminSessionToken,
      p_id: String(id),
    });
    if (error) throw error;
  }

  async function login(identity, password) {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('admin_login', {
      p_username: identity,
      p_password: password,
    });
    if (error) throw error;
    if (!data || typeof data !== 'string') throw new Error('Invalid admin credentials');
    adminSessionToken = data;
    sessionStorage.setItem('d3.admin.session_token', data);
    return true;
  }

  async function logout() {
    const token = adminSessionToken || sessionStorage.getItem('d3.admin.session_token');
    adminSessionToken = null;
    sessionStorage.removeItem('d3.admin.session_token');
    if (!token) return;

    try {
      const supabase = getSupabase();
      await supabase.rpc('admin_logout_session', { p_token: token });
    } catch {
      // Session is already local-cleared; ignore remote logout failures.
    }
  }

  async function isAuthenticated() {
    if (adminSessionToken) return true;
    const token = sessionStorage.getItem('d3.admin.session_token');
    if (!token) return false;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('admin_validate_session', {
        p_token: token,
      });
      if (error || !data) return false;
      adminSessionToken = token;
      return true;
    } catch {
      return false;
    }
  }

  window.D3ListingsApi = {
    fetchPublicListings,
    fetchAllListings,
    fetchListingById,
    createListing,
    updateListing,
    deleteListing,
    login,
    logout,
    isAuthenticated,
  };
})();
