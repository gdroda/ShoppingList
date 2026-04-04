FROM node:22-alpine AS build
WORKDIR /shoppinglist.client
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf ./
COPY --from=build /shoppinglist.client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]