FROM node:22-alpine AS development
WORKDIR /app
# Cypress is run separately, not needed in either application image.
ENV CYPRESS_INSTALL_BINARY=0
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080", "--strictPort"]

FROM development AS builder
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
