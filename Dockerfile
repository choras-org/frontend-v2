FROM node:22 AS deps

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

WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package*.json ./

# Also runs the postinstall script, which copies rhino3dm to public/
RUN npm ci

COPY . .

# Development: the Vite dev server, only built with `docker build --target dev`
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Vite bakes VITE_API_URL into the build; without it the app uses http://localhost:5001
FROM deps AS build
ARG VITE_API_URL
RUN npm run build

# Production (default): the static build served by Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
