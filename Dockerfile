FROM node:22-alpine3.18 AS builder
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "index.js", "./"]
RUN apk add --update nodejs npm

COPY ["package.json", "package-lock.json*", "index.js", "./"]
RUN npm install --omit=dev

FROM alpine:3.18 AS deploy
RUN apk add --update nodejs npm
COPY --from=builder /usr/src/app /app
WORKDIR /app

EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s CMD wget --spider http://localhost:8000/status > /dev/null || exit 1
CMD ["node", "index.js"]

