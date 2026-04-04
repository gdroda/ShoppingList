FROM node:22-alpine AS build
WORKDIR /shoppinglist.client
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.template.conf
COPY --from=build /shoppinglist.client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["sh", "-c", "export BACKEND_URL=${BACKEND_URL:-http://localhost:8080} && envsubst '${BACKEND_URL}' < /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]