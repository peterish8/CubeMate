FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server/ ./server/
COPY tsconfig*.json ./
EXPOSE 3001
ENV PORT=3001
CMD ["npx", "tsx", "server/index.ts"]
