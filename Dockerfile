# Use the Node.js 14 Alpine image as a parent image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only the necessary files to the container
COPY index.js ./
COPY endpoints.js ./

# Copy package.json and package-lock.json (if available) to the container
COPY package*.json ./

# Install any dependencies
RUN npm install

# Inform Docker the port the container is listening on at runtime.
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "index.js" ]