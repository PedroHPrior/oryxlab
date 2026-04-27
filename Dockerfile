# OryxLab — single-stage container that builds the Vite SPA + serves it via
# the Express API. Used by Railway. Avoids Nixpacks' cache-mount EBUSY bug
# where npm ci can't clean a node_modules/.cache that's bind-mounted.

FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install deps separately so layer cache survives source changes.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --include=dev

# Copy source + build the SPA.
COPY . .
RUN npm run build

# --- runtime image ----------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Bring only what runtime needs: prod deps + dist + server + scraped data.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server ./server
COPY product/data ./product/data
COPY public/data ./public/data

# Railway injects PORT; default 3001 for local prod testing.
ENV PORT=3001
EXPOSE 3001

# Healthcheck verifies the API is up before Railway routes traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.mjs"]
