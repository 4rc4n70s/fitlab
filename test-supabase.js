require('dotenv').config({ path: 'apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing library_folders...');
  try {
    const { data, error } = await supabase.from('library_folders').select('*');
    console.log('Folders error:', error);
  } catch (e) {
    console.error('Folders catch:', e);
  }

  console.log('Testing library_items...');
  try {
    const { data, error } = await supabase.from('library_items').select('*');
    console.log('Items error:', error);
  } catch (e) {
    console.error('Items catch:', e);
  }
}
test();
