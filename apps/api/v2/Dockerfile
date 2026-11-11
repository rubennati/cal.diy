FROM node:22-alpine@sha256:5b05da3f938f1c604b24c633646d48805a6667f378cb4908438616f3cc48a0bf AS build

ARG DATABASE_DIRECT_URL
ARG DATABASE_URL

WORKDIR /calcom

RUN set -eux;
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV DATABASE_DIRECT_URL=${DATABASE_DIRECT_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV USE_POOL="true"

COPY . .

RUN yarn install --immutable
RUN yarn workspace @calcom/api-v2 run generate-schemas
RUN yarn workspace @calcom/api-v2 run build:docker
RUN yarn workspace @calcom/api-v2 run build

USER node

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD node -e "fetch('http://localhost:' + (process.env.API_PORT || '5555') + '/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD [ "yarn", "workspace", "@calcom/api-v2", "start:prod"]
