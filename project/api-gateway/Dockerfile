FROM node:20-alpine

WORKDIR /app

COPY api-gateway/package.json api-gateway/package-lock.json ./
RUN npm install

COPY protos ./protos
COPY api-gateway/tsconfig.json api-gateway/main.ts ./
COPY api-gateway/src ./src

EXPOSE 8080

CMD ["npm", "run", "start"]
