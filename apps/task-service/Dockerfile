FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared package
COPY shared ./shared

# Copy service code
COPY apps/task-service ./apps/task-service

# Install dependencies and build shared + service
RUN npm install
RUN npm --workspace=shared run build
RUN npm --workspace=@taskflow/task-service run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3004

COPY package*.json ./
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/apps/task-service/dist ./apps/task-service/dist
COPY --from=builder /app/apps/task-service/package.json ./apps/task-service/

RUN npm install --omit=dev

EXPOSE 3004

CMD ["node", "apps/task-service/dist/index.js"]
