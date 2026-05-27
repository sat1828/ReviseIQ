# ─────────────────────────────────────────────────────────────────────────────
# ReviseIQ Backend — Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Build:  docker build -t reviseiq-backend .
# Run:    docker run -p 3001:3001 --env-file .env reviseiq-backend
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy lockfile + manifest first for Docker layer caching
COPY package*.json ./

# npm ci: uses lockfile exactly → reproducible builds
# --only=production: skips nodemon and other devDependencies
RUN npm ci --only=production

# Copy server code
COPY server.js .

# Expose port (must match PORT env var)
EXPOSE 3001

# Drop root privileges
USER appuser

CMD ["node", "server.js"]
