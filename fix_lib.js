const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/(main)/main/library/page.tsx', 'utf8');

content = content.replace(/'use client'/g, "'use client'\nimport { get, set } from 'idb-keyval'");

// 1. useEffect
content = content.replace(
/  \/\/ Load from localStorage on mount\n  useEffect\(\(\) => {\n    const savedFolders = localStorage\.getItem\('fitlab_library_folders'\)\n    const savedItems = localStorage\.getItem\('fitlab_library_items'\)/,
`  // Load from localStorage on mount
  useEffect(() => {
    const init = async () => {
      const savedFolders = await get('fitlab_library_folders')
      const savedItems = await get('fitlab_library_items')`
);

content = content.replace(
/    if \(savedFolders\) \{\n      try \{ setFolders\(JSON\.parse\(savedFolders\)\) \} catch \(e\) \{ console\.error\(e\) \}\n    \} else \{\n      setFolders\(defaultFolders\)\n      localStorage\.setItem\('fitlab_library_folders', JSON\.stringify\(defaultFolders\)\)\n    \}/g,
`    if (savedFolders) {
      try { setFolders(typeof savedFolders === 'string' ? JSON.parse(savedFolders) : savedFolders) } catch (e) { console.error(e) }
    } else {
      setFolders(defaultFolders)
      set('fitlab_library_folders', defaultFolders)
    }`
);

content = content.replace(
/    if \(savedItems\) \{\n      try \{ setItems\(JSON\.parse\(savedItems\)\) \} catch \(e\) \{ console\.error\(e\) \}\n    \} else \{/g,
`    if (savedItems) {
      try { setItems(typeof savedItems === 'string' ? JSON.parse(savedItems) : savedItems) } catch (e) { console.error(e) }
    } else {`
);

content = content.replace(
/      setItems\(defaultItems\)\n      localStorage\.setItem\('fitlab_library_items', JSON\.stringify\(defaultItems\)\)\n      \n      \/\/ Update folder counts\n      const counts: Record<string, number> = \{ 'f1': 2, 'f2': 4, 'f3': 3 \}\n      const updatedFolders = defaultFolders\.map\(f => \(\{ \.\.\.f, itemCount: counts\[f\.id\] \|\| 0 \}\)\)\n      setFolders\(updatedFolders\)\n      localStorage\.setItem\('fitlab_library_folders', JSON\.stringify\(updatedFolders\)\)\n    \}\n  \}, \[\]\)/g,
`      setItems(defaultItems)
      set('fitlab_library_items', defaultItems)
      
      // Update folder counts
      const counts: Record<string, number> = { 'f1': 2, 'f2': 4, 'f3': 3 }
      const updatedFolders = defaultFolders.map(f => ({ ...f, itemCount: counts[f.id] || 0 }))
      setFolders(updatedFolders)
      set('fitlab_library_folders', updatedFolders)
    }
    init()
  }, [])`
);

content = content.replace(
/  const updateFolderCounts = \(currentItems: LibraryItem\[\]\) => \{\n    setFolders\(prev => \{\n      const updated = prev\.map\(f => \(\{\n        \.\.\.f,\n        itemCount: currentItems\.filter\(i => i\.folderId === f\.id\)\.length\n      \}\)\)\n      localStorage\.setItem\('fitlab_library_folders', JSON\.stringify\(updated\)\)\n      return updated\n    \}\)\n  \}/g,
`  const updateFolderCounts = (currentItems: LibraryItem[]) => {
    setFolders(prev => {
      const updated = prev.map(f => ({
        ...f,
        itemCount: currentItems.filter(i => i.folderId === f.id).length
      }))
      set('fitlab_library_folders', updated)
      return updated
    })
  }`
);

content = content.replace(/localStorage\.setItem\('fitlab_library_items', JSON\.stringify\((.*?)\)\)/g, "set('fitlab_library_items', $1)");
content = content.replace(/localStorage\.setItem\('fitlab_library_folders', JSON\.stringify\((.*?)\)\)/g, "set('fitlab_library_folders', $1)");
content = content.replace(/const items = JSON\.parse\(localStorage\.getItem\('fitlab_library_items'\) \|\| '\[\]'\)/g, "const items = await get('fitlab_library_items') || []");

fs.writeFileSync('apps/web/src/app/(main)/main/library/page.tsx', content);

