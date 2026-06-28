require('dotenv').config({ path: 'apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFolder(folderName) {
  const dirPath = path.join(__dirname, 'apps/web/public', folderName);
  const files = fs.readdirSync(dirPath);
  const results = [];

  for (const file of files) {
    if (file === '.' || file === '..') continue;
    const filePath = path.join(dirPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'image/jpeg';
    
    const fileName = `stock/${folderName}/${file}`;
    console.log(`Uploading ${fileName}...`);
    
    const { data, error } = await supabase.storage
      .from('generations')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true
      });
      
    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
    } else {
      const { data: publicUrlData } = supabase.storage.from('generations').getPublicUrl(fileName);
      results.push({
        name: file.replace(/-/g, ' ').replace(/\.[^/.]+$/, ''),
        url: publicUrlData.publicUrl,
        type: folderName === 'clothes' ? 'clothes' : 'model'
      });
    }
  }
  return results;
}

async function main() {
  const clothes = await uploadFolder('clothes');
  const models = await uploadFolder('models');
  const allStock = [...clothes, ...models];
  fs.writeFileSync('stock_urls.json', JSON.stringify(allStock, null, 2));
  console.log('Done! Wrote stock_urls.json');
}

main();
