const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// Remove the duplicates
content = content.replace(/  const \[page, setCurrentPage\] = useState\(1\)\n  const ITEMS_PER_PAGE = 10\n/, '');

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content);
