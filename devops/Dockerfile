FROM node:9.2.1

EXPOSE 3000
WORKDIR /app

COPY package.json /app/
RUN yarn install

COPY . /app/

ENTRYPOINT ["/app/devops/entrypoint.sh"]

