FROM node:18-alpine
WORKDIR /usr/app
COPY package.json .
RUN yarn install --silent
COPY . .
