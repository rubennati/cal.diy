FROM --platform=$BUILDPLATFORM node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5 AS builder

WORKDIR /calcom

## If we want to read any ENV variable from .env file, we need to first accept and pass it as an argument to the Dockerfile
ARG NEXT_PUBLIC_LICENSE_CONSENT
ARG NEXT_PUBLIC_WEBSITE_TERMS_URL
ARG NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL
ARG DATABASE_URL
ARG NEXTAUTH_SECRET=secret
ARG CALENDSO_ENCRYPTION_KEY=secret
ARG MAX_OLD_SPACE_SIZE=6144
ARG NEXT_PUBLIC_API_V2_URL
ARG CSP_POLICY

## We need these variables as required by Next.js build to create rewrites
ARG NEXT_PUBLIC_SINGLE_ORG_SLUG
ARG ORGANIZATIONS_ENABLED

## cal.forte fork branding — baked at build time (NEXT_PUBLIC is inlined into the bundle).
## Pass values via build-args in release-docker; defaults fall back to constants.ts.
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_COMPANY_NAME
ARG NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS

ENV NEXT_PUBLIC_WEBAPP_URL=http://NEXT_PUBLIC_WEBAPP_URL_PLACEHOLDER \
  NEXT_PUBLIC_API_V2_URL=$NEXT_PUBLIC_API_V2_URL \
  NEXT_PUBLIC_LICENSE_CONSENT=$NEXT_PUBLIC_LICENSE_CONSENT \
  NEXT_PUBLIC_WEBSITE_TERMS_URL=$NEXT_PUBLIC_WEBSITE_TERMS_URL \
  NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL=$NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL \
  DATABASE_URL=$DATABASE_URL \
  DATABASE_DIRECT_URL=$DATABASE_URL \
  NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
  CALENDSO_ENCRYPTION_KEY=${CALENDSO_ENCRYPTION_KEY} \
  NEXT_PUBLIC_SINGLE_ORG_SLUG=$NEXT_PUBLIC_SINGLE_ORG_SLUG \
  ORGANIZATIONS_ENABLED=$ORGANIZATIONS_ENABLED \
  NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
  NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME \
  NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS=$NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS \
  NODE_OPTIONS=--max-old-space-size=${MAX_OLD_SPACE_SIZE} \
  BUILD_STANDALONE=true \
  CSP_POLICY=$CSP_POLICY

COPY package.json yarn.lock .yarnrc.yml playwright.config.ts turbo.json i18n.json ./
COPY .yarn ./.yarn
# Yarn's immutable resolution needs every workspace manifest represented by the
# root workspace patterns, even though only web/API sources are shipped later.
COPY apps ./apps
COPY example-apps ./example-apps
COPY packages ./packages

RUN yarn config set httpTimeout 1200000
RUN yarn install --immutable
# Build and make embed servable from web/public/embed folder
RUN yarn workspace @calcom/trpc run build
RUN yarn --cwd packages/embeds/embed-core workspace @calcom/embed-core run build
RUN yarn --cwd apps/web workspace @calcom/web run copy-app-store-static
RUN yarn --cwd apps/web workspace @calcom/web run build
RUN rm -rf node_modules/.cache .yarn/cache apps/web/.next/cache

FROM node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5 AS builder-two

WORKDIR /calcom
ARG NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000

ENV NODE_ENV=production

COPY package.json .yarnrc.yml turbo.json i18n.json ./
COPY .yarn ./.yarn
COPY --from=builder /calcom/yarn.lock ./yarn.lock
COPY --from=builder /calcom/node_modules ./node_modules
COPY --from=builder /calcom/packages ./packages
COPY --from=builder /calcom/apps/web ./apps/web
COPY --from=builder /calcom/packages/prisma/schema.prisma ./prisma/schema.prisma
COPY scripts scripts
RUN chmod +x scripts/*

# Save value used during this build stage. If NEXT_PUBLIC_WEBAPP_URL and BUILT_NEXT_PUBLIC_WEBAPP_URL differ at
# run-time, then start.sh will find/replace static values again.
ENV NEXT_PUBLIC_WEBAPP_URL=$NEXT_PUBLIC_WEBAPP_URL \
  BUILT_NEXT_PUBLIC_WEBAPP_URL=$NEXT_PUBLIC_WEBAPP_URL

RUN scripts/replace-placeholder.sh http://NEXT_PUBLIC_WEBAPP_URL_PLACEHOLDER ${NEXT_PUBLIC_WEBAPP_URL}

# cal.forte slim (Stage 2): drop dev-only CLI/test tooling before the runner copies the tree,
# so it shrinks the shipped image and its CVE surface.
# Kept on purpose — these ARE needed at runtime:
#   turbo            -> start.sh runs `yarn start` = `turbo run start --filter=@calcom/web`
#   ts-node          -> start.sh runs the app-store seed via ts-node
#   @trigger.dev/sdk -> prod dependency imported by app code (the CLI `trigger.dev` is not)
RUN rm -rf \
  node_modules/trigger.dev \
  node_modules/@depot \
  node_modules/vitest node_modules/@vitest \
  node_modules/playwright node_modules/playwright-core node_modules/@playwright \
  node_modules/@biomejs \
  || true

FROM node:20@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5 AS runner

WORKDIR /calcom

RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd wget && rm -rf /var/lib/apt/lists/*

COPY --from=builder-two /calcom ./
ARG NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000
ENV NEXT_PUBLIC_WEBAPP_URL=$NEXT_PUBLIC_WEBAPP_URL \
  BUILT_NEXT_PUBLIC_WEBAPP_URL=$NEXT_PUBLIC_WEBAPP_URL

ENV NODE_ENV=production

# cal.forte hardened defaults — privacy-by-default; override via runtime env if ever needed.
# No usage-telemetry flag here on purpose: the upstream telemetry module is deleted in this
# fork, so a flag would document a control that does not exist. See .ai/hardening-checklist.md
# §3 and scripts/fork-guard-telemetry.sh.
ENV GOOGLE_ADS_ENABLED=0 \
  LINKEDIN_ADS_ENABLED=0

# Runtime URL replacement and Turbo/Next caches need these paths writable without granting
# ownership of the complete application tree.
RUN mkdir -p /calcom/.turbo \
  && chown -R node:node /calcom/.turbo /calcom/apps/web/.next /calcom/apps/web/public \
  && yarn config set installStatePath /tmp/cal-forte-install-state.gz

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --retries=5 \
  CMD wget --spider http://localhost:3000 || exit 1

CMD ["/calcom/scripts/start.sh"]
