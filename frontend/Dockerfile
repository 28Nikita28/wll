FROM node:22-alpine-slim AS build
WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package*.json ./
RUN npm install --silent

COPY . .
RUN npm run build -- --sourcemap false

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]