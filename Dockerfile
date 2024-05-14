FROM node:22-alpine3.19 as builder
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "index.js", "./"]
RUN npm install --omit=dev

FROM alpine:3.19 as deploy
RUN apk add --no-cache nodejs
COPY --from=builder /usr/src/app /app
WORKDIR /app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s CMD wget --spider http://localhost:8000 > /dev/null || exit 1
CMD ["node", "index.js"]
