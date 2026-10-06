FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 GAME_DATA_DIR=/data MATCH_LOG_PATH=/data/matches.jsonl
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /data && chown -R node:node /app /data
COPY --from=build /app/dist ./dist
COPY server.js avatar.js hero-renderer.js records.js chain-recorder.js ./
USER node
EXPOSE 8080
CMD ["node", "server.js"]
