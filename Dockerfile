# Stage 1: Build the application
# Use a Node.js base image for building
FROM node:lts-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
# This way, if only source code changes, npm install doesn't re-run
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
# Using 'npm ci' is often preferred in CI/CD for reproducibility if package-lock.json exists
# Otherwise, 'npm install' is fine.
RUN npm ci # or npm install

# Copy the rest of your application source code
COPY . .

# Build the application for production
# This assumes your 'package.json' has a "build" script that outputs to the 'dist' directory.
# For Vite, this is the default.
RUN npm run build

# Stage 2: Serve the built application with Nginx
# Use a lightweight Nginx base image for serving static files
FROM nginx:stable-alpine as final

# Copy the built assets from the build stage to Nginx's default static content directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80. Nginx typically listens on port 80.
# Fly.io will map this container port to an external port for access.
EXPOSE 80

# Command to start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
