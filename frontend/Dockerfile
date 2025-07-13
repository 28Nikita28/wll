FROM node:22-alpine3.21 AS build
WORKDIR /app


COPY package*.json ./

RUN npm install --silent

COPY . .
ARG VITE_API_KEY="default_api_key"
ARG VITE_AUTH_DOMAIN="default.firebaseapp.com"
ARG VITE_PROJECT_ID="default-project"
ARG VITE_STORAGE_BUCKET="default.appspot.com"
ARG VITE_MESSAGING_SENDER_ID="1234567890"
ARG VITE_APP_ID="1:default:web"

# Проверяем переменные перед сборкой
RUN echo "Building with Firebase config:" && \
    echo "API_KEY=${VITE_API_KEY}" && \
    echo "AUTH_DOMAIN=${VITE_AUTH_DOMAIN}"

# Собираем приложение с явной передачей переменных
RUN VITE_API_KEY=$VITE_API_KEY \
    VITE_AUTH_DOMAIN=$VITE_AUTH_DOMAIN \
    VITE_PROJECT_ID=$VITE_PROJECT_ID \
    VITE_STORAGE_BUCKET=$VITE_STORAGE_BUCKET \
    VITE_MESSAGING_SENDER_ID=$VITE_MESSAGING_SENDER_ID \
    VITE_APP_ID=$VITE_APP_ID \
    npm run build
RUN npm run build -- --sourcemap false

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]