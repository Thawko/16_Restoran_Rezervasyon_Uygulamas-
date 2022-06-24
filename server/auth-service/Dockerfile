FROM node:16

WORKDIR /usr/src/app/auth

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]