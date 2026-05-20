import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function checkModels() {
  if (!API_KEY) {
    console.error("No GEMINI_API_KEY found in .env");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error("API Error:", data.error.message);
      return;
    }

    console.log("--- AVAILABLE MODELS FOR YOUR KEY ---");
    data.models.forEach(m => {
      console.log(`- Name: ${m.name}`);
      console.log(`  Supported Actions: ${m.supportedGenerationMethods.join(', ')}`);
      console.log('---');
    });
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

checkModels();
