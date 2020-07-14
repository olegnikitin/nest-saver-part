FROM node:14.3.0-alpine as base

FROM base as builder
RUN apk add make gcc g++ python jq
COPY package*.json ./
RUN jq .version package.json -r > version.txt
COPY .npmrc .
RUN npm install --only=production
RUN mv node_modules node_modules_prod
RUN npm install
COPY . .
RUN npm run build

FROM base
RUN apk add bash openssl
WORKDIR /usr/src/app
COPY ./ormconfig.js .
COPY --from=builder version.txt .
COPY --from=builder /dist ./dist
COPY --from=builder /bin ./bin
COPY --from=builder /node_modules_prod ./node_modules
USER node

EXPOSE 3000
CMD ["node", "dist/main"]
