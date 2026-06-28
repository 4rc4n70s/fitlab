const fs = require('fs');
let content = fs.readFileSync('apps/web/src/services/storage.ts', 'utf8');

content = content.replace("const { data, error } = await supabase.storage", "const { error } = await supabase.storage");
fs.writeFileSync('apps/web/src/services/storage.ts', content);
