# --- build -------------------------------------------------------------
# O build precisa das devDependencies (typescript, tailwind); a imagem final
# não.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime -----------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./

USER node

EXPOSE 3001
CMD ["npm", "run", "start", "--", "-p", "3001"]
