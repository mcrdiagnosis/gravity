FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build || true # In case there's a build script, if not, we skip

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# For ts-node execution in dev/easypanel
RUN npm install -g ts-node typescript

EXPOSE 8000

CMD ["npx", "prisma", "db", "push", "&&", "npm", "run", "start"]
