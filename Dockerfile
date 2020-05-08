FROM node:10.20.1-jessie

ADD ./ /app
WORKDIR /app

RUN npm install

ENTRYPOINT []
CMD ["node","./backend/backend.js"]
