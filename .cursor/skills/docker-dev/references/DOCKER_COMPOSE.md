# Docker Compose Patterns

Pełne wzorce docker-compose i konfiguracji serwisów dla Symfony 7.4 LTS + PostgreSQL + Vue 3.

## Pełny docker-compose.yml (Development)

```yaml
services:
  # ============ BACKEND ============
  php:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
      target: dev
    volumes:
      - ./backend:/app
      # Exclude vendor from bind mount for performance
      - backend_vendor:/app/vendor
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://app:secret@postgres:5432/app_db?serverVersion=16&charset=utf8"
      APP_ENV: dev
      APP_DEBUG: "1"
      APP_SECRET: "dev-secret-change-in-prod"
      MAILER_DSN: "smtp://mailpit:1025"
    networks:
      - app-network

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "${NGINX_PORT:-8080}:80"
    volumes:
      - ./backend/public:/app/public:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - php
    networks:
      - app-network

  # ============ DATABASE ============
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-app_db}
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secret}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-app} -d ${POSTGRES_DB:-app_db}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # ============ FRONTEND ============
  node:
    build:
      context: .
      dockerfile: docker/node/Dockerfile
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    ports:
      - "${VITE_PORT:-5173}:5173"
    command: npm run dev -- --host 0.0.0.0
    environment:
      VITE_API_URL: "http://localhost:${NGINX_PORT:-8080}"
    networks:
      - app-network

  # ============ DEV TOOLS ============
  mailpit:
    image: axllent/mailpit
    ports:
      - "${MAILPIT_UI_PORT:-8025}:8025"
      - "${MAILPIT_SMTP_PORT:-1025}:1025"
    networks:
      - app-network

  adminer:
    image: adminer
    ports:
      - "${ADMINER_PORT:-8081}:8080"
    depends_on:
      - postgres
    networks:
      - app-network

volumes:
  postgres_data:
  backend_vendor:
  frontend_node_modules:

networks:
  app-network:
    driver: bridge
```

## docker-compose.override.yml (Lokalne nadpisania)

```yaml
# docker-compose.override.yml - NIE commituj do repo
# Każdy dev może mieć inne porty, Xdebug config etc.
services:
  php:
    environment:
      XDEBUG_MODE: "debug"
      XDEBUG_CONFIG: "client_host=host.docker.internal"
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## docker-compose.test.yml (Testy)

```yaml
# docker-compose.test.yml - Oddzielna baza dla testów
services:
  php:
    environment:
      DATABASE_URL: "postgresql://app:secret@postgres-test:5432/app_test?serverVersion=16&charset=utf8"
      APP_ENV: test

  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_test
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    tmpfs:
      - /var/lib/postgresql/data  # RAM = szybsze testy
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app_test"]
      interval: 3s
      timeout: 3s
      retries: 5
```

Uruchomienie testów:
```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm php php bin/phpunit
```

## Nginx Config

```nginx
# docker/nginx/default.conf
server {
    listen 80;
    server_name localhost;
    root /app/public;

    location / {
        try_files $uri /index.php$is_args$args;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass php:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;

        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;

        internal;
    }

    location ~ \.php$ {
        return 404;
    }

    client_max_body_size 20M;

    error_log /var/log/nginx/error.log;
    access_log /var/log/nginx/access.log;
}
```

## Dockerfile - Node (Frontend)

```dockerfile
# docker/node/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Don't run as root
RUN adduser -D appuser && chown -R appuser:appuser /app
USER appuser

# Dependencies are installed via volume + npm install
EXPOSE 5173
```

## .env.example

```bash
# .env.example - Commituj to do repo
# Skopiuj jako .env i dostosuj lokalne wartości

# Docker ports (zmień jeśli konflikty)
NGINX_PORT=8080
POSTGRES_PORT=5432
VITE_PORT=5173
MAILPIT_UI_PORT=8025
MAILPIT_SMTP_PORT=1025
ADMINER_PORT=8081

# PostgreSQL
POSTGRES_DB=app_db
POSTGRES_USER=app
POSTGRES_PASSWORD=secret

# Symfony
APP_ENV=dev
APP_SECRET=change-me-in-production
```

## Inicjalizacja Projektu (pierwszy raz)

```bash
# 1. Skopiuj .env
cp .env.example .env    # Linux/Mac/Git Bash
# copy .env.example .env  # PowerShell (Windows)

# 2. Build i start
docker compose up -d --build

# 3. Backend dependencies
docker compose exec php composer install

# 4. Database setup
docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction

# 5. Frontend dependencies
docker compose exec node npm install

# 6. Sprawdź
# Backend: http://localhost:8080
# Frontend: http://localhost:5173
# Mailpit: http://localhost:8025
# Adminer: http://localhost:8081
```

## Porty (domyślne)

| Serwis | Port | URL |
|--------|------|-----|
| Nginx (API) | 8080 | http://localhost:8080 |
| Vite (Frontend) | 5173 | http://localhost:5173 |
| PostgreSQL | 5432 | `psql -h localhost -p 5432 -U app app_db` |
| Mailpit UI | 8025 | http://localhost:8025 |
| Adminer | 8081 | http://localhost:8081 |

---

**Version:** 1.0  
**Last Updated:** 2026-02-16
