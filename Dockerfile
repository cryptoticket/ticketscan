# latest LTS (long term support) version from DockerHub
FROM node:9.5.0

# Create app directory
RUN mkdir  /app
WORKDIR /app

# Install app dependencies
# COPY package.json /usr/src/app
COPY . /app


# Bundle app source
# COPY . /app

# EXPOSE 8080

# CMD [ "npm", "start" ]