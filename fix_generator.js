const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');

content = content.replace("const { getAvailableModels } = await import('@/actions/gemini')", "");
fs.writeFileSync('apps/web/src/app/(main)/main/generator/page.tsx', content);
