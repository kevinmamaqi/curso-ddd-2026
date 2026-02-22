FROM node:20-alpine

WORKDIR /app

COPY order-fulfillment-service/package.json order-fulfillment-service/package-lock.json ./
RUN npm install

COPY protos ./protos
COPY order-fulfillment-service/tsconfig.json order-fulfillment-service/main.ts ./
COPY order-fulfillment-service/src ./src

EXPOSE 3002
EXPOSE 9465
EXPOSE 50052

CMD ["npm", "run", "start:docker"]
