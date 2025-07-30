import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load university list
const universityPath = path.join(__dirname, 'universityList.json');
const outputPath = path.join(__dirname, 'output', 'universitylist.json');

const keywords = ['scholarship', 'grant', 'cybersecurity', 'funding', 'financial aid', 'tuition', 'fellowship'];

async function loadUniversityList() {
  const content = await fs.readFile(universityPath, 'utf-8');
  return JSON.parse(content);
}

async function scrapeScholarshipData(universities) {
  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  for (const uni of universities) {
    console.log(`🔍 Scraping: ${uni.name} - ${uni.url}`);
    const page = await browser.newPage();
    try {
      await page.goto(uni.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

      const matchedKeywords = keywords.filter((keyword) => pageText.includes(keyword));
      if (matchedKeywords.length > 0) {
        results.push({
          name: uni.name,
          url: uni.url,
          region: uni.region || 'unknown',
          matched_keywords: matchedKeywords,
        });
        console.log(`✅ Found keywords: ${matchedKeywords.join(', ')}`);
      } else {
        console.log('❌ No keywords found.');
      }
    } catch (err) {
      console.warn(`⚠️ Failed to scrape ${uni.url}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return results;
}

async function saveData(data) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(`📁 Saved results to ${outputPath}`);
}

async function main() {
  try {
    const universityList = await loadUniversityList();
    const scrapedData = await scrapeScholarshipData(universityList);
    await saveData(scrapedData);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
