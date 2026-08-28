FROM oven/bun:1.4-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE_URL=https://api.dragon-azul.dev/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
