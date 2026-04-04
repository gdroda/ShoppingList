FROM node:22-alpine AS build
WORKDIR /shoppinglist.client
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.template.conf
COPY --from=build /shoppinglist.client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["sh", "-c", "BACKEND_URL=${BACKEND_URL:-http://backend-api:8080} && envsubst '$BACKEND_URL' < /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]