require('dotenv').config({ path: 'apps/web/.env' });
require('dotenv').config({ path: 'apps/web/.env.local' });
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error("No API key"); process.exit(1); }
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    const models = data.models || [];
    const imgModels = models.filter(m => m.name.toLowerCase().includes('imagen') || m.name.toLowerCase().includes('image') || m.name.toLowerCase().includes('gemini'));
    console.log(imgModels.map(m => m.name + ' - ' + m.supportedGenerationMethods.join(',')));
  })
  .catch(err => console.error(err));
