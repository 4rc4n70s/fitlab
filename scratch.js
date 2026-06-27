const apiKey = process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => console.log("MODELS API:", JSON.stringify(data, null, 2)))
  .catch(console.error);

fetch(`https://generativelanguage.googleapis.com/v1beta/tunedModels?key=${apiKey}`)
  .then(res => res.json())
  .then(data => console.log("TUNED API:", JSON.stringify(data, null, 2)))
  .catch(console.error);
