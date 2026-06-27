const fs = require('fs');
let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// Find the end of the collections list and add the button
if (!content.includes('Cargar más colecciones')) {
  content = content.replace(
    /      <\/div>\n\n      \{\/\* Modal Regenerar \*\/\}/,
    `      </div>\n\n      {collections.length > page * ITEMS_PER_PAGE && (\n        <div className="flex justify-center mt-4">\n          <button \n            onClick={() => setPage(p => p + 1)}\n            className="px-6 py-2.5 border border-border bg-surface-card hover:bg-surface-soft text-foreground font-medium transition-colors"\n          >\n            Cargar más colecciones\n          </button>\n        </div>\n      )}\n\n      {/* Modal Regenerar */}`
  );
}

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content);
