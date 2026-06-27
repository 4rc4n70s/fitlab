const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// The AI-fallback added `currentPage` and broke the file structure. Let's fix it.
content = content.replace(/currentPage/g, 'page');
content = content.replace(/<div className="flex flex-col gap-6">\n\s*\{collections.length === 0/g, '{collections.length === 0');
fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content);
