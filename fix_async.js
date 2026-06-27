const fs = require('fs');

function fixCollections() {
  let content = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');
  content = content.replace(/const loadCollections = \(\) => {/g, "const loadCollections = async () => {");
  content = content.replace(/const handleDeleteCollection = \(\) => {/g, "const handleDeleteCollection = async () => {");
  content = content.replace(/const handleDeletePhoto = \(\) => {/g, "const handleDeletePhoto = async () => {");
  content = content.replace(/const handleRegen = async \(\) => {/, "const handleRegen = async () => {"); // already async probably
  
  // Also fix the loadCollections call inside useEffect, we can't use await directly, but it's an async function now.
  // window.addEventListener('fitlab_collections_updated', loadCollections) is fine.
  
  fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', content);
}

function fixLibrary() {
  let content = fs.readFileSync('apps/web/src/app/(main)/main/library/page.tsx', 'utf8');
  content = content.replace(/const loadItems = \(\) => {/g, "const loadItems = async () => {");
  content = content.replace(/const loadFolders = \(\) => {/g, "const loadFolders = async () => {");
  content = content.replace(/const handleSaveEdit = \(\) => {/g, "const handleSaveEdit = async () => {");
  content = content.replace(/const handleDelete = \(\) => {/g, "const handleDelete = async () => {");
  content = content.replace(/const handleBulkDelete = \(\) => {/g, "const handleBulkDelete = async () => {");
  content = content.replace(/const handleBulkMove = \(\) => {/g, "const handleBulkMove = async () => {");
  content = content.replace(/const handleAddFolder = \(\) => {/g, "const handleAddFolder = async () => {");
  content = content.replace(/const handleEditFolder = \(\) => {/g, "const handleEditFolder = async () => {");
  content = content.replace(/const handleDeleteFolder = \(\) => {/g, "const handleDeleteFolder = async () => {");
  content = content.replace(/const updateFolderCounts = \(currentItems: LibraryItem\[\]\) => {/g, "const updateFolderCounts = async (currentItems: LibraryItem[]) => {");
  content = content.replace(/const updateFolderCounts = async \(currentItems: LibraryItem\[\]\) => \{\n\s*set\('fitlab_library_folders'/g, "const updateFolderCounts = async (currentItems: LibraryItem[]) => {\n    const f = await get('fitlab_library_folders');\n    set('fitlab_library_folders'");
  
  fs.writeFileSync('apps/web/src/app/(main)/main/library/page.tsx', content);
}

fixCollections();
fixLibrary();
console.log("Fixed async");
