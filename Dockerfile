FROM node:18-alpine3.18 as builder
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "index.js", "./"]
RUN npm install --omit=dev

FROM alpine:3.18 as deploy
RUN apk add --no-cache nodejs
COPY --from=builder /usr/src/app /app
WORKDIR /app
EXPOSE 3000
CMD ["node", "index.js"]
