FROM node:18-alpine3.17
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent 
RUN mv node_modules ../
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s CMD wget --spider http://localhost:8000 > /dev/null || exit 1
CMD ["npm", "start"]
