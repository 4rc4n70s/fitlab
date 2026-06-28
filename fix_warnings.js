const fs = require('fs');

// fix collections
let col = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');
col = col.replace(/import { processVirtualTryOn } from '@\/actions\/gemini'\n/, '');
col = col.replace(/const urlToBase64 = [\s\S]*?\}\n\n/, '');
col = col.replace(/any/g, 'unknown');
col = col.replace(/catch \(e\) \{/g, 'catch (e: unknown) {');
fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', col);

// fix generator
let gen = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');
gen = gen.replace(/import { useRouter } from 'next\/navigation'\n/, '');
gen = gen.replace(/interface Generation \{[\s\S]*?\}\n/, '');
gen = gen.replace(/catch \(e\) \{/g, 'catch (e: unknown) {');
fs.writeFileSync('apps/web/src/app/(main)/main/generator/page.tsx', gen);
