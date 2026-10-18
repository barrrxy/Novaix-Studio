/* Isi URL project dan anon/publishable key Supabase. Keduanya boleh ada di frontend.
   JANGAN pernah menaruh service_role key di file ini. */
window.NOVAIX_SUPABASE_CONFIG = {
  url: 'https://ttubgxnnrgxujzgynuvw.supabase.co',
  anonKey: 'sb_publishable_FMJjOmAesauZJtePQZHULA_eaEg4c9R',
  bucket: 'project-covers'
};
console.log('NOVAIX URL:', window.NOVAIX_SUPABASE_CONFIG?.url);
console.log('Supabase tersedia:', !!window.supabase);