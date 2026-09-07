# --- Build stage -----------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# --- Runtime stage -----------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

# Run as a non-root user (good default, also relevant to the isolation story
# in the wider project — no reason for this container to run as root).
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./

ENV PORT=3000
ENV NODE_ENV=production

USER appuser
EXPOSE 3000

# Container-level health check — separate from any K8s probe you add later.
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
