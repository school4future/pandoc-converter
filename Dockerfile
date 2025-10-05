# Base on official pandoc image (Debian-based) so pandoc is preinstalled
FROM pandoc/core:latest

# Install Node.js + wkhtmltopdf for HTML->PDF
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm wkhtmltopdf ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps
COPY package.json ./
RUN npm install --production

# Copy app code
COPY server.js ./

EXPOSE 8080
CMD ["npm", "start"]