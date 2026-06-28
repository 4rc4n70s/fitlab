const fs = require('fs');

// Fix collectionsClient.ts
let colClient = fs.readFileSync('apps/web/src/services/collectionsClient.ts', 'utf8');
colClient = colClient.replace(/data: any/g, 'data: Record<string, unknown>');
fs.writeFileSync('apps/web/src/services/collectionsClient.ts', colClient);

// Fix library/page.tsx
let libPage = fs.readFileSync('apps/web/src/app/(main)/main/library/page.tsx', 'utf8');
libPage = libPage.replace(/any/g, 'unknown');
fs.writeFileSync('apps/web/src/app/(main)/main/library/page.tsx', libPage);

// Fix generator/page.tsx
let genPage = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');
genPage = genPage.replace(/const router = useRouter\(\)/, '');
genPage = genPage.replace(/interface Collection \{[\s\S]*?\}\n/, '');
genPage = genPage.replace(/const urlToBase64 = [\s\S]*?\}\n\n/, '');
genPage = genPage.replace(/onChange=\{\(e\) => setSelectedModel\(e.target.value\)\}/, 'onChange={(e) => setSelectedModel(e.target.value)}');
fs.writeFileSync('apps/web/src/app/(main)/main/generator/page.tsx', genPage);

// Fix collections/page.tsx
let colPage = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');
colPage = colPage.replace(/import \{ dbClient as db \} from '@\/services\/collectionsClient'\nimport \{ uploadImageToSupabase \} from '@\/services\/storage'\n/, '');
colPage = colPage.replace(/'use client'/, "'use client'\nimport { dbClient as db } from '@/services/collectionsClient'\nimport { uploadImageToSupabase } from '@/services/storage'");
fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', colPage);
