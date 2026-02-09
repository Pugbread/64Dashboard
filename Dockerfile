# Stage 1: Build the React client
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
# Vite outputs to ../server/dist/client, so we need server/dist to exist
RUN mkdir -p server/dist
RUN cd client && npm run build

# Stage 2: Build the server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production image (using slim instead of alpine for better DNS/networking compatibility)
FROM node:20-slim
WORKDIR /app

# Copy server production deps
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled server
COPY --from=server-build /app/server/dist ./dist

# Copy built client into dist/client
COPY --from=client-build /app/server/dist/client ./dist/client

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
