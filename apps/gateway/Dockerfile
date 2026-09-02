FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY apps/gateway ./apps/gateway

RUN npm install
RUN npm --workspace=@taskflow/gateway run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV GATEWAY_PORT=3000

COPY package*.json ./
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=builder /app/apps/gateway/package.json ./apps/gateway/

RUN npm install --omit=dev

EXPOSE 3000

CMD ["node", "apps/gateway/dist/index.js"]
