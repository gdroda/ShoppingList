FROM node:22-alpine AS build
WORKDIR /shoppinglist.client
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_FRONTEND_URL
ARG VITE_BACKEND_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.template.conf
COPY --from=build /shoppinglist.client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["sh", "-c", "VITE_BACKEND_URL=${VITE_BACKEND_URL:-http://localhost:5000} VITE_FRONTEND_URL=${VITE_FRONTEND_URL:-http://localhost:3000} && envsubst '$VITE_BACKEND_URL,$VITE_FRONTEND_URL' < /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]