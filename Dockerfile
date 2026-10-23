# Etapa 1: Construcción (Build)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Variables de entorno para build de Vite
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

# Compilar la aplicación React para producción
RUN npm run build

# Etapa 2: Servidor Web de Producción (Nginx)
FROM nginx:alpine

# Copiar configuración personalizada de Nginx para SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos compilados desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto estándar
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
