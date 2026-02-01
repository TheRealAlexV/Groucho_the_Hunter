# =============================================================================
# Dockerfile for Groucho the Hunter
# =============================================================================
# Multi-stage build for optimized production deployment
# Stage 1: Build the application with Node.js
# Stage 2: Serve static files with nginx
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
# Use npm ci for reproducible builds
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
# Vite outputs to 'dist' directory by default
RUN npm run build

# Verify build output
RUN ls -la dist/

# -----------------------------------------------------------------------------
# STAGE 2: Production
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Install additional security headers module
RUN apk add --no-cache curl

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for nginx (security best practice)
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginx-user -u 1001 -G nginx-group

# Set proper permissions
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    chown -R nginx-user:nginx-group /etc/nginx/conf.d

# Switch to non-root user
USER nginx-user

# Expose port 80
EXPOSE 80

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start nginx in foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]

# -----------------------------------------------------------------------------
# BUILD & RUN COMMANDS
# -----------------------------------------------------------------------------
# Build image:
#   docker build -t groucho-the-hunter:latest .
#
# Run container:
#   docker run -d -p 8080:80 --name groucho groucho-the-hunter:latest
#
# Access game:
#   http://localhost:8080
#
# Stop container:
#   docker stop groucho && docker rm groucho
# -----------------------------------------------------------------------------
