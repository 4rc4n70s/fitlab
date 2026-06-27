const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Add import if not present
  if (!content.includes("import { get, set } from 'idb-keyval'")) {
    // find first import
    content = "import { get, set } from 'idb-keyval'\n" + content;
  }

  // Replace JSON.parse(localStorage.getItem('...')) with (await get('...'))
  // Since we might not be in an async function for some of these, wait...
  // In collections/page.tsx, loadCollections is already synchronous. We need to make it async.
  
  // Actually, a simpler regex approach for both parsing and setting:
  // For library/page.tsx
  content = content.replace(/localStorage\.setItem\('fitlab_library_items',\s*JSON\.stringify\((.*?)\)\)/g, "set('fitlab_library_items', $1)");
  content = content.replace(/localStorage\.setItem\('fitlab_library_folders',\s*JSON\.stringify\((.*?)\)\)/g, "set('fitlab_library_folders', $1)");
  content = content.replace(/const saved = localStorage\.getItem\('fitlab_library_items'\)/g, "const saved = await get('fitlab_library_items')");
  content = content.replace(/const savedFolders = localStorage\.getItem\('fitlab_library_folders'\)/g, "const savedFolders = await get('fitlab_library_folders')");
  content = content.replace(/if \(saved\) setItems\(JSON\.parse\(saved\)\)/g, "if (saved) setItems(saved)");
  content = content.replace(/if \(savedFolders\) setFolders\(JSON\.parse\(savedFolders\)\)/g, "if (savedFolders) setFolders(savedFolders)");
  content = content.replace(/const items = JSON\.parse\(localStorage\.getItem\('fitlab_library_items'\) \|\| '\[\]'\)/g, "const items = await get('fitlab_library_items') || []");

  // For collections/page.tsx
  content = content.replace(/localStorage\.setItem\('fitlab_collections',\s*JSON\.stringify\((.*?)\)\)/g, "set('fitlab_collections', $1)");
  content = content.replace(/const saved = localStorage\.getItem\('fitlab_collections'\)/g, "const saved = await get('fitlab_collections')");
  content = content.replace(/if \(saved\) \{\s*setCollections\(JSON\.parse\(saved\)\)\s*\}/g, "if (saved) { setCollections(saved) }");
  content = content.replace(/const currentCols = JSON\.parse\(localStorage\.getItem\('fitlab_collections'\) \|\| '\[\]'\) as Collection\[\]/g, "const currentCols = (await get('fitlab_collections') || []) as Collection[]");
  content = content.replace(/const updatedCols = JSON\.parse\(localStorage\.getItem\('fitlab_collections'\) \|\| '\[\]'\) as Collection\[\]/g, "const updatedCols = (await get('fitlab_collections') || []) as Collection[]");
  
  // For generator/page.tsx
  content = content.replace(/const storedItems = localStorage\.getItem\('fitlab_library_items'\)/g, "const storedItems = await get('fitlab_library_items')");
  content = content.replace(/const storedFolders = localStorage\.getItem\('fitlab_library_folders'\)/g, "const storedFolders = await get('fitlab_library_folders')");
  content = content.replace(/if \(storedItems\) setItems\(JSON\.parse\(storedItems\)\)/g, "if (storedItems) setItems(storedItems)");
  content = content.replace(/if \(storedFolders\) setFolders\(JSON\.parse\(storedFolders\)\)/g, "if (storedFolders) setFolders(storedFolders)");
  
  // Also fix generator/page.tsx initCollections
  content = content.replace(/const initialCols = JSON\.parse\(localStorage\.getItem\('fitlab_collections'\) \|\| '\[\]'\)/g, "const initialCols = await get('fitlab_collections') || []");

  fs.writeFileSync(path, content);
}

replaceFile('apps/web/src/app/(main)/main/collections/page.tsx');
replaceFile('apps/web/src/app/(main)/main/generator/page.tsx');
replaceFile('apps/web/src/app/(main)/main/library/page.tsx');

console.log("Done");
