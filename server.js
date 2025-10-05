const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

// Allow large manuscripts (adjust if needed)
app.use(bodyParser.text({ type: "*/*", limit: "100mb" }));

// --- Simple security ---
const API_KEY = process.env.PANDOC_API_KEY || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  if (!API_KEY) return next(); // if no key set, treat as open (useful for first boot)
  const keyHeader = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (keyHeader !== API_KEY) return res.status(401).send("Unauthorized");
  next();
});

app.get("/health", (_req, res) => res.status(200).send("OK"));

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 512 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

app.post("/convert", async (req, res) => {
  const md = req.body || "";
  if (!md || typeof md !== "string") return res.status(400).send("Missing Markdown body");

  const q = new URLSearchParams((req.url.split("?")[1] || ""));
  const format = (q.get("format") || "epub").toLowerCase(); // epub | docx | pdf
  const title = q.get("title") || "Untitled";
  const author = q.get("author") || "Unknown";
  const lang = q.get("lang") || "en";

  if (!["epub", "docx", "pdf"].includes(format)) return res.status(400).send("Invalid format");

  const tmpDir = "/tmp";
  const inputPath = path.join(tmpDir, "book.md");
  const outputPath = path.join(tmpDir, `book.${format}`);
  const htmlPath = path.join(tmpDir, "book.html");

  try {
    fs.writeFileSync(inputPath, md, "utf8");

    const baseMeta = `--metadata=title:"${title.replaceAll('"', '\\"')}" --metadata=author:"${author.replaceAll('"', '\\"')}" --metadata=lang:"${lang}"`;

    if (format === "pdf") {
      // Convert to standalone HTML first, then to PDF with wkhtmltopdf (lighter than LaTeX)
      const toHtmlCmd = `pandoc "${inputPath}" -s -o "${htmlPath}" ${baseMeta}`;
      await run(toHtmlCmd);
      const toPdfCmd = `wkhtmltopdf --quiet "${htmlPath}" "${outputPath}"`;
      await run(toPdfCmd);
    } else {
      const toOutCmd = `pandoc "${inputPath}" -o "${outputPath}" ${baseMeta}`;
      await run(toOutCmd);
    }

    const file = fs.readFileSync(outputPath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="book.${format}"`);
    res.status(200).send(file);
  } catch (e) {
    console.error("Conversion error:", e.message);
    res.status(500).send("Conversion failed");
  } finally {
    // Cleanup
    for (const p of [inputPath, outputPath, htmlPath]) {
      try { fs.unlinkSync(p); } catch {}
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Pandoc API running on port ${PORT}`));