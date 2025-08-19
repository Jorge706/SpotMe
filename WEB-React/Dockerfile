# Dockerfile para SpotMe Frontend (React)
# Build stage
FROM node:lts-alpine3.22 AS build

ARG VITE_RECAPTCHA_SITE_KEY

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

ENV VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}

# Build de la aplicación
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build de React
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto 50500
EXPOSE 50500

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]