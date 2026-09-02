FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared package
COPY shared ./shared

# Copy service code
COPY apps/auth-service ./apps/auth-service

# Install dependencies and build shared + service
RUN npm install
RUN npm --workspace=shared run build
RUN npm --workspace=@taskflow/auth-service run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/

RUN npm install --omit=dev

EXPOSE 3001

CMD ["node", "apps/auth-service/dist/index.js"]
