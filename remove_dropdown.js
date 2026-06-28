const fs = require('fs');

let code = fs.readFileSync('apps/web/src/app/(main)/main/generator/page.tsx', 'utf8');

// 1. Remove getAvailableModels import
code = code.replace(/import { getAvailableModels, processVirtualTryOn } from '@\/actions\/gemini'/, "import { processVirtualTryOn } from '@/actions/gemini'");
// Fallback if already partially replaced
code = code.replace(/import { getAvailableModels } from '@\/actions\/gemini'\n/, '');

// 2. Remove states
code = code.replace(/const \[availableModels, setAvailableModels\] = useState<\{id: string, name: string\}\[\]>\(\[\]\)\n/g, '');
code = code.replace(/const \[selectedModel, setSelectedModel\] = useState<string>\(''\)\n/g, '');
code = code.replace(/const \[isLoadingModels, setIsLoadingModels\] = useState\(true\)\n/g, '');

// 3. Remove the fetchModels useEffect completely
const useEffStart = code.indexOf('useEffect(() => {');
const useEffEnd = code.indexOf('}, [])', useEffStart);
if (useEffStart > -1 && useEffEnd > -1) {
    const useEffBlock = code.substring(useEffStart, useEffEnd + 7);
    if (useEffBlock.includes('fetchModels')) {
        code = code.replace(useEffBlock + '\n\n', '');
    }
}

// 4. Remove the UI section "0. AI Model"
const uiStart = code.indexOf('{/* 0. AI Model */}');
const uiEnd = code.indexOf('{/* 1. Prompt Engineering */}');
if (uiStart > -1 && uiEnd > -1) {
    code = code.substring(0, uiStart) + code.substring(uiEnd);
}

// 5. Remove selectedModel param from processVirtualTryOn call
code = code.replace(/const response = await processVirtualTryOn\(masterPrompt, modelsToProcess\[i\]\.url, clothesB64s, selectedModel\)/, "const response = await processVirtualTryOn(masterPrompt, modelsToProcess[i].url, clothesB64s)");


fs.writeFileSync('apps/web/src/app/(main)/main/generator/page.tsx', code);
