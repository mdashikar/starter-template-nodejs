FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package.json ./

COPY ecosystem.config.json ./

RUN npm i

RUN npm install pm2 -g

COPY . .

EXPOSE 3000

CMD ["pm2-runtime",  "ecosystem.config.json", "--exp-backoff-restart-delay=100", "--time"]