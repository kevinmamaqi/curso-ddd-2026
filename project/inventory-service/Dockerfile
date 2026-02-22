FROM node:20-alpine

WORKDIR /app

COPY inventory-service/package.json inventory-service/package-lock.json ./
RUN npm install

COPY protos ./protos
COPY inventory-service/tsconfig.json inventory-service/main.ts ./
COPY inventory-service/src ./src

EXPOSE 3000
EXPOSE 9464
EXPOSE 50051

CMD ["npm", "run", "start:docker"]
