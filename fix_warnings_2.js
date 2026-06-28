const fs = require('fs');

// fix collections e again
let col = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');
col = col.replace(/catch \(e: unknown\) \{/g, 'catch (error: unknown) {\n  console.error(error);');
fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', col);

// fix generator e again
let gen = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');
gen = gen.replace(/catch \(e: unknown\) \{/g, 'catch (error: unknown) {\n  console.error(error);');
fs.writeFileSync('apps/web/src/app/(main)/main/generator/page.tsx', gen);
