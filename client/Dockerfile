FROM node:20-alpine
WORKDIR /app
COPY package.json vite.config.js ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev", "--", "--host"]
