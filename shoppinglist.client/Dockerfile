FROM node:22-alpine AS build
WORKDIR /shoppinglist.client
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_FRONTEND_API
ARG VITE_BACKEND_API
ENV VITE_FRONTEND_API=$VITE_FRONTEND_API
ENV VITE_BACKEND_API=$VITE_BACKEND_API
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.template.conf
COPY --from=build /shoppinglist.client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["sh", "-c", "BACKEND_URL=${BACKEND_URL:-http://localhost:5000} FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000} && envsubst '$BACKEND_URL,$FRONTEND_URL' && envsubst '$BACKEND_URL' < /etc/nginx/nginx.template.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]