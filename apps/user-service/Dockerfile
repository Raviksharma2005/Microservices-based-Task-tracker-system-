FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared package
COPY shared ./shared

# Copy service code
COPY apps/user-service ./apps/user-service

# Install dependencies and build shared + service
RUN npm install
RUN npm --workspace=shared run build
RUN npm --workspace=@taskflow/user-service run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

COPY package*.json ./
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist
COPY --from=builder /app/apps/user-service/package.json ./apps/user-service/

RUN npm install --omit=dev

EXPOSE 3002

CMD ["node", "apps/user-service/dist/index.js"]
