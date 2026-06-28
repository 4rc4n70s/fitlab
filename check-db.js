const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles } = await supabase.from('profiles').select('id, email');
  const user = profiles.find(p => p.email === 'zanardi.ag@gmail.com') || profiles[0];
  
  if (!user) {
    console.log("No user found");
    return;
  }
  
  const { data: folders, error: fErr } = await supabase.from('library_folders').select('*').eq('user_id', user.id);
  const { data: items, error: iErr } = await supabase.from('library_items').select('*').eq('user_id', user.id);
  
  console.log("Folders Error:", fErr);
  console.log("Folders:", folders);
  console.log("Items Error:", iErr);
  console.log("Items count:", items ? items.length : 0);
  if (items && items.length > 0) {
    console.log("First item:", items[0]);
  }
}
main();
