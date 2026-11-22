# syntax=docker/dockerfile:1
FROM node:26-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# The official image ships an unprivileged "node" user.
USER node

EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-5000}/health || exit 1

CMD ["node", "server.js"]
