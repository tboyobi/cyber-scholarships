import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import universities from "./universityList.json" assert { type: "json" };

const KEYWORDS = /(scholarship|grant|stipend|financial aid|Cybersecurity)/i;

async function scrapeStatic() {
  const results = [];
  for (const uni of universities) {
    if (uni.dynamic) continue;
    try {
      const { data } = await axios.get(uni.url);
      const $ = cheerio.load(data);
      const text = $("body").text();
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => KEYWORDS.test(l));
      results.push({
        university: uni.name,
        url: uni.url,
        highlights: lines.slice(0, 20),
      });
    } catch (err) {
      console.error(`Error scraping ${uni.name}:`, err.message);
    }
  }
  fs.writeFileSync(
    "./output/static_results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("✅ Static scraping complete.");
}

scrapeStatic();
