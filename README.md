# Pandoc Converter (Render-ready)

A tiny HTTP API that converts Markdown to **EPUB**, **DOCX**, or **PDF** using Pandoc.
- EPUB/DOCX: direct via `pandoc`
- PDF: `pandoc` → standalone HTML → `wkhtmltopdf`

## Endpoints

- `GET /health` → "OK"
- `POST /convert?format=epub|docx|pdf&title=...&author=...&lang=en`
  - Body: raw Markdown (text/plain)
  - Returns: the converted file as a binary response

## Security
Set env vars in your host (Render etc.):
- `PANDOC_API_KEY` — required API key to access the service (send with `X-API-Key` or `Authorization: Bearer ...`)
- `ALLOWED_ORIGINS` — comma-separated list of allowed origins for CORS

## Local test (Docker)

```bash
docker build -t pandoc-converter .
docker run --rm -p 8080:8080 -e PANDOC_API_KEY=devkey pandoc-converter
curl -X POST "http://localhost:8080/convert?format=epub&title=Test&author=Demo"      -H "Content-Type: text/plain"      -H "X-API-Key: devkey"      --data-binary @README.md      -o test.epub
```

## Notes
- Large PDF builds are handled via `wkhtmltopdf` (no LaTeX required).
- The service writes to `/tmp` and cleans up after each request.