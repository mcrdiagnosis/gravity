FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build || true # In case there's a build script, if not, we skip

FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

RUN mkdir -p uploads && chmod 777 uploads

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# For ts-node execution in dev/easypanel
RUN npm install -g ts-node typescript

EXPOSE 8000

CMD ["sh", "-c", "npx prisma db push && npm run start"]
