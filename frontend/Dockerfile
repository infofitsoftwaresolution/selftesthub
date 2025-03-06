# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the built app
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Serve the app
CMD ["serve", "-s", "dist", "-l", "3000"] 