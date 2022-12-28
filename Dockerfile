FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["nodemon", "server.js"]
