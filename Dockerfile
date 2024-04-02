# Use the official Node.js 20.x image
FROM node:20

# Install PostgreSQL client
RUN apt-get update && apt-get install -y postgresql-client

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

CMD [ "yarn", "start" ]