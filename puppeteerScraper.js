// puppeteerScraper.js
import fs from "fs/promises";
import puppeteer from "puppeteer";

const KEYWORDS = /(scholarship|grant|stipend|financial aid|Cybersecurity)/i;

const universities = JSON.parse(
  await fs.readFile("./universityList.json", "utf-8")
);

async function scrapeDynamic() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const uni of universities) {
    if (!uni.dynamic) continue;

    try {
      await page.goto(uni.url, { waitUntil: "networkidle2" });
      const text = await page.evaluate(() => document.body.innerText);
      const lines = text.split("\n").filter((line) => KEYWORDS.test(line));
      results.push({
        university: uni.name,
        url: uni.url,
        highlights: lines.slice(0, 20),
      });
    } catch (err) {
      console.error(`Error scraping ${uni.name}:`, err.message);
    }
  }

  await browser.close();
  await fs.writeFile(
    "./output/dynamic_results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("✅ Dynamic scraping complete.");
}

scrapeDynamic();
