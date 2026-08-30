# --- build -------------------------------------------------------------
# `npm ci` e não `npm install`: só o ci instala exatamente o que está no
# package-lock.json e falha se o lock divergir do package.json. Com
# `npm install` o build de produção fica livre para resolver versões que
# ninguém auditou — perdendo justamente a reprodutibilidade e a verificação
# de integridade que o lock existe para dar.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# --- runtime -----------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Instala só as dependências de produção em vez de copiar o node_modules do
# estágio de build: typescript, jest, eslint e o CLI do Nest existem apenas
# para compilar, e levá-los para a imagem final engorda o deploy e amplia a
# superfície de ataque do container sem servir para nada em execução.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# O processo não precisa de root para nada; rodar como root significa que
# qualquer execução de código arbitrária no Node vira root do container.
USER node

EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main"]
