FROM node:16

WORKDIR /usr/src/app/reservation

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]