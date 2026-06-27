const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');

// 1. Pagination state
content = content.replace(
/  const \[collections, setCollections\] = useState<Collection\[\]>\(\[\]\)/,
  "const [collections, setCollections] = useState<Collection[]>([])\n  const [page, setPage] = useState(1)\n  const ITEMS_PER_PAGE = 10"
);

// 2. handleRegenerateSubmit - remove early setRegenModal(null)
content = content.replace(
/      \}\n      \n      setRegenModal\(null\)\n      \n      const response = await processVirtualTryOn/,
  "      }\n      \n      const response = await processVirtualTryOn"
);

// 3. handleRegenerateSubmit - add setRegenModal(null) in finally
content = content.replace(
/    \} finally \{\n      setIsRegenerating\(false\)\n    \}\n  \}/,
  "    } finally {\n      setIsRegenerating(false)\n      setRegenModal(null)\n    }\n  }"
);

// 4. handleDownloadImage fetch blob
content = content.replace(
/  const handleDownloadImage = \(base64Url: string, name: string\) => \{\n    saveAs\(base64Url, name\)\n  \}/,
  "  const handleDownloadImage = async (base64Url: string, name: string) => {\n    try {\n      const res = await fetch(base64Url)\n      const blob = await res.blob()\n      saveAs(blob, name)\n    } catch (e) {\n      console.error(e)\n    }\n  }"
);

// 5. Apply pagination map and remove rounded corners from cards
content = content.replace(
/          \{collections\.map\(\(collection\) => \(\{/g,
  "          {collections.slice(0, page * ITEMS_PER_PAGE).map((collection) => {"
);

// Remove rounded from empty state
content = content.replace(
/border-dashed border-border rounded-2xl bg-surface-card p-12 text-center my-8/g,
  "border-dashed border-border bg-surface-card p-12 text-center my-8"
);

// Remove rounded from generation cards
content = content.replace(
/ className="flex bg-surface-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-foreground\/30 transition-colors"/g,
  " className=\"flex bg-surface-card border border-border overflow-hidden shadow-sm hover:border-foreground/30 transition-colors\""
);

// Add load more button
content = content.replace(
/      \{\/\* Visor de imágenes \*\/\}/g,
  "      {collections.length > page * ITEMS_PER_PAGE && (\n        <div className=\"flex justify-center mt-4\">\n          <button \n            onClick={() => setPage(p => p + 1)}\n            className=\"px-6 py-2.5 border border-border bg-surface-card hover:bg-surface-soft text-foreground font-medium transition-colors\"\n          >\n            Cargar más colecciones\n          </button>\n        </div>\n      )}\n\n      {/* Visor de imágenes */}"
);

fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content);

