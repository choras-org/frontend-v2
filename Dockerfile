# Use an official Node.js image
FROM node:22

# Install system deps required by node-canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire frontend project
COPY . .

# Expose port 5173 for React
EXPOSE 5173

# Set environment variable to ensure the app runs in development mode
ENV NODE_ENV=development

# Run the React frontend using Vite's development mode
CMD ["npm", "run", "dev", "--", "--host"]
