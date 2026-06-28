const fs = require('fs');

// Fix collections/page.tsx
let col = fs.readFileSync('apps/web/src/app/(main)/main/collections/page.tsx', 'utf8');
col = col.replace(/const \{ processVirtualTryOn, getAvailableModels \} = await import\('@\/actions\/gemini'\)\n      const models = await getAvailableModels\(\)\n      const selectedModel = models.find\(\(m: any\) => m.name.toLowerCase\(\).includes\('nano banana'\)\)\?.id \|\| models\[0\]\?.id\n      const response = await processVirtualTryOn\(currentCollection.prompt, currentCollection.modelImage!, currentCollection.clothes, selectedModel\)/, 
`const { processVirtualTryOn } = await import('@/actions/gemini')
      const response = await processVirtualTryOn(currentCollection.prompt, currentCollection.modelImage!, currentCollection.clothes)`);
fs.writeFileSync('apps/web/src/app/(main)/main/collections/page.tsx', col);

// Fix generator/page.tsx
let gen = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');
gen = gen.replace(/import { getAvailableModels, processVirtualTryOn } from '@\/actions\/gemini'/, "import { processVirtualTryOn } from '@/actions/gemini'");
gen = gen.replace(/const \[availableModels, setAvailableModels\] = useState<\{id: string, name: string\}\[\]>\(\[\]\)\n  const \[selectedModel, setSelectedModel\] = useState<string>\(''\)/, "");
gen = gen.replace(/useEffect\(\(\) => \{\n    const fetchModels = async \(\) => \{\n      try \{\n        const models = await getAvailableModels\(\)\n        if \(models.length > 0\) \{\n          setAvailableModels\(models\)\n          const nanoBanana = models.find\(m => m.name.toLowerCase\(\).includes\('nano banana'\) \|\| m.name.toLowerCase\(\).includes\('nano banano pro'\)\)\n          if \(nanoBanana\) \{\n            setSelectedModel\(nanoBanana.id\)\n          \} else \{\n            setSelectedModel\(models\[0\].id\)\n          \}\n        \}\n      \} catch \(e: unknown\) \{\n        console.error\('Error fetching models:', e\)\n      \}\n    \}\n    fetchModels\(\)\n  \}, \[\]\)/, "");
gen = gen.replace(/const response = await processVirtualTryOn\(masterPrompt, modelsToProcess\[i\].url, clothesB64s, selectedModel\)/, "const response = await processVirtualTryOn(masterPrompt, modelsToProcess[i].url, clothesB64s)");

// Remove select box from generator UI
// Since I don't know the exact regex for the select box, I will just match a broad chunk or use a more precise script.
