# -----------------------------
# Base image
# -----------------------------
FROM node:20-alpine AS base

# -----------------------------
# Dependencies
# -----------------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm ci

# -----------------------------
# Builder
# -----------------------------
FROM base AS builder
WORKDIR /app

# --- Public build-time env (non-sensitive)
ARG NEXT_PUBLIC_ROOT_DOMAIN
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_NOTIFICATION_URL
ARG PUBLIC_API_URL
ARG FILE_URL
ARG NEXT_PUBLIC_DEPLOYMENT_ENV

# Make them available during build
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_NOTIFICATION_URL=$NEXT_PUBLIC_NOTIFICATION_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV FILE_URL=$FILE_URL
ENV NEXT_PUBLIC_DEPLOYMENT_ENV=$NEXT_PUBLIC_DEPLOYMENT_ENV
ENV NEXT_PUBLIC_POSTHOG_KEY=phc_aQfYyn4dssO4tb3zl8RJTDsHyfUqOpri28bA5THjNpr
ENV NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -----------------------------
# Runner
# -----------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Copy built artifacts
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
USER node
CMD ["node", "server.js"]
