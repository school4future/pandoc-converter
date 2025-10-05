# Debian base (stable apt + wkhtmltopdf available)
FROM debian:bookworm-slim

# Install pandoc, wkhtmltopdf, Node.js, npm, and fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      pandoc wkhtmltopdf nodejs npm ca-certificates \
      fonts-dejavu-core fonts-noto-core fonts-noto-cjk \
      libxrender1 libxext6 libfontconfig1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# App deps
COPY package.json ./
RUN npm install --production

# App code
COPY server.js ./

EXPOSE 8080
CMD ["npm", "start"]
