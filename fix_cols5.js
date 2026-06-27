const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// Change setPage to setCurrentPage in definition
content = content.replace(
  /const \[page, setPage\] = useState\(1\)/,
  "const [page, setCurrentPage] = useState(1)"
);

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content);
