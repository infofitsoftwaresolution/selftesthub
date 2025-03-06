FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Start the app
CMD ["npm", "run", "preview"] 