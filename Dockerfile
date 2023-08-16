FROM node:16-alpine

WORKDIR /app

COPY *.js .
COPY *.json .

RUN npm install

CMD ["npm", "start"]
