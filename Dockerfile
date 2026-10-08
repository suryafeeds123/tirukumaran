# Build:  docker build -t tirukumaran .
# Run:    docker run -p 3000:3000 -v tk-data:/app/data --env-file .env.production tirukumaran
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3000
CMD ["npm", "start"]
