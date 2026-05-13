const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_BASE = process.env.EXPO_PUBLIC_API_URL 
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/i18n` 
        : 'http://localhost:3000/api/i18n';
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

function fetchData(url) {
  return new Promise((resolve, reject) => {
    const httpModule = url.startsWith('https') ? https : http;
    httpModule
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function unflattenJson(flatObj) {
  const result = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        const nextPart = parts[i + 1];
        current[part] = /^\d+$/.test(nextPart) ? [] : {};
      }
      current = current[part];
    }
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      const index = parseInt(lastPart, 10);
      current[index] = value;
    } else {
      current[lastPart] = value;
    }
  }
  return result;
}

async function syncI18n() {
  console.log('Syncing i18n resources...');
  console.log(`API Base: ${API_BASE}`);

  try {
    if (!fs.existsSync(LOCALES_DIR)) {
      fs.mkdirSync(LOCALES_DIR, { recursive: true });
    }

    const allData = await fetchData(`${API_BASE}/export`);

    for (const [lang, translations] of Object.entries(allData)) {
      const filePath = path.join(LOCALES_DIR, `${lang}.json`);
      const nestedTranslations = unflattenJson(translations);
      fs.writeFileSync(
        filePath,
        JSON.stringify(nestedTranslations, null, 2),
        'utf8'
      );
      console.log(`✅ Written ${lang}.json (${Object.keys(translations).length} keys)`);
    }

    console.log('i18n sync complete!');
  } catch (error) {
    console.error('Error syncing i18n:', error);
    process.exit(1);
  }
}

syncI18n();
