# Alpine-based image with pandoc preinstalled
FROM pandoc/core:latest

# Install Node.js and wkhtmltopdf (for PDF via HTML path)
RUN apk add --no-cache nodejs npm wkhtmltopdf fontconfig ttf-dejavu

WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./

EXPOSE 8080
CMD ["npm", "start"]
