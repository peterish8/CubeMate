# CubeMate signaling server
# Runs the Socket.io matchmaking server on Fly.io (or any Docker host).
# The React frontend is deployed separately on Vercel.

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY server/ ./server/

EXPOSE 3001
CMD ["node_modules/.bin/tsx", "server/index.ts"]
