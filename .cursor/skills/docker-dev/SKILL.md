---
name: docker-dev
description: Docker Docker Compose containerized development Symfony 7.4 LTS PHP 8.2 PostgreSQL Vue Node.js cross-platform Windows Linux local development environment
---

# Docker Development (Cross-Platform)

Docker-based local development environment for Symfony 7.4 LTS + PostgreSQL + Vue 3 stack, designed to work identically on **Windows** and **Linux**.

> **Filozofia:** Docker to equalizer - ten sam stack, te same komendy, niezależnie od OS.

## Version Constraints

| Tool | Version | Notes |
|------|---------|-------|
| **Docker Engine** | 24+ | Docker Desktop (Windows/Mac) lub Engine (Linux) |
| **Docker Compose** | v2+ | `docker compose` (nie `docker-compose`) |
| **PHP image** | `8.2-fpm` | Matchuje `php: ^8.2` z composer.json |
| **PostgreSQL image** | `16-alpine` | Matchuje server_version z Doctrine |
| **Node image** | `20-alpine` | LTS dla frontendu Vue 3 |

## When to Use This Skill

- Tworzenie/edycja `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Konfiguracja środowiska lokalnego
- Troubleshooting problemów Docker na Windows vs Linux
- Optymalizacja buildu i volumeów
- Konfiguracja CI/CD z Docker

## Quick Reference

### Komendy (działają na Windows i Linux)

```bash
# Start całego stacku
docker compose up -d

# Stop
docker compose down

# Rebuild po zmianie Dockerfile
docker compose up -d --build

# Logi
docker compose logs -f php
docker compose logs -f postgres

# Shell do kontenera PHP
docker compose exec php bash

# Komendy Symfony w kontenerze
docker compose exec php php bin/console cache:clear
docker compose exec php php bin/console doctrine:migrations:migrate

# Komendy Composer w kontenerze
docker compose exec php composer install
docker compose exec php composer require symfony/security-bundle

# Testy
docker compose exec php php bin/phpunit

# Frontend
docker compose exec node npm install
docker compose exec node npm run dev
docker compose exec node npm test
```

## Project Structure

```
project-root/
├── docker/
│   ├── php/
│   │   └── Dockerfile          # PHP 8.2 + extensions
│   ├── node/
│   │   └── Dockerfile          # Node 20 (frontend)
│   └── nginx/
│       └── default.conf        # Nginx config
├── docker-compose.yml          # Orkiestracja usług
├── docker-compose.override.yml # Lokalne nadpisania (git-ignored)
├── .dockerignore               # Pliki wykluczone z buildu
├── .gitattributes              # KRYTYCZNE: wymusza LF line endings
├── .env                        # Zmienne środowiskowe (git-ignored)
├── .env.example                # Template zmiennych (w repo)
├── backend/                    # Symfony 7.4 LTS
│   ├── composer.json
│   └── ...
└── frontend/                   # Vue 3 + TypeScript
    ├── package.json
    └── ...
```

## Dockerfile - PHP (Symfony)

```dockerfile
FROM php:8.2-fpm-alpine AS base

# System dependencies
RUN apk add --no-cache \
    icu-dev \
    libpq-dev \
    linux-headers \
    $PHPIZE_DEPS

# PHP extensions required by Symfony + PostgreSQL
RUN docker-php-ext-install \
    intl \
    pdo_pgsql \
    opcache

# Composer
COPY --from=composer:2 /usr/local/bin/composer /usr/local/bin/composer

WORKDIR /app

# ------- DEV stage -------
FROM base AS dev

RUN pecl install xdebug && docker-php-ext-enable xdebug

# PHP config for dev
RUN echo "memory_limit=512M" > /usr/local/etc/php/conf.d/memory.ini
RUN echo "upload_max_filesize=20M" > /usr/local/etc/php/conf.d/uploads.ini

# Don't run as root
RUN adduser -D appuser
USER appuser

# ------- PROD stage -------
FROM base AS prod

COPY backend/ /app/

RUN composer install --no-dev --optimize-autoloader --no-scripts

# OPcache tuning
RUN echo "opcache.preload=/app/config/preload.php" > /usr/local/etc/php/conf.d/opcache-prod.ini \
    && echo "opcache.preload_user=www-data" >> /usr/local/etc/php/conf.d/opcache-prod.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache-prod.ini

USER www-data
```

## Docker Compose (Dev)

```yaml
# docker-compose.yml
services:
  php:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
      target: dev
    volumes:
      - ./backend:/app
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://app:secret@postgres:5432/app_db?serverVersion=16&charset=utf8"
      APP_ENV: dev
      APP_DEBUG: 1

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./backend/public:/app/public:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - php

  node:
    build:
      context: .
      dockerfile: docker/node/Dockerfile
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    command: npm run dev -- --host 0.0.0.0

  mailpit:
    image: axllent/mailpit
    ports:
      - "8025:8025"
      - "1025:1025"

volumes:
  postgres_data:
```

## Cross-Platform: Kluczowe Zasady

### 1. Line Endings - OBOWIĄZKOWY .gitattributes

**To jest NAJWAŻNIEJSZA rzecz dla cross-platform.** Bez tego Docker buildy pękają na Windows.

```gitattributes
# .gitattributes - MUSI być w repo
* text=auto eol=lf

# Pliki które MUSZĄ mieć LF (Docker, shell, PHP)
*.sh text eol=lf
*.php text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.json text eol=lf
*.js text eol=lf
*.ts text eol=lf
*.vue text eol=lf
*.md text eol=lf
*.env text eol=lf
*.conf text eol=lf
*.cfg text eol=lf
*.xml text eol=lf
*.sql text eol=lf
Dockerfile text eol=lf
docker-compose*.yml text eol=lf
Makefile text eol=lf

# Binarne - nie modyfikuj
*.png binary
*.jpg binary
*.gif binary
*.ico binary
*.woff binary
*.woff2 binary
*.ttf binary
*.eot binary
```

### 2. Shell Komendy - Uniwersalne

```bash
# ✅ GOOD: Używaj docker compose (działa wszędzie)
docker compose up -d
docker compose exec php bash

# ❌ BAD: Nie zakładaj bash/PowerShell na hoście
bash scripts/setup.sh       # Nie działa na Windows
./scripts/setup.sh           # Nie działa na Windows

# ✅ GOOD: Skrypty uruchamiaj WEWNĄTRZ kontenera
docker compose exec php bash scripts/setup.sh
```

### 3. Ścieżki - Zawsze Forward Slash

```yaml
# ✅ GOOD: Forward slash w docker-compose.yml
volumes:
  - ./backend:/app
  - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf

# ❌ BAD: Backslash (nie działa w Docker)
volumes:
  - .\backend:/app
```

### 4. Makefile vs Skrypt NPM

Na Windows nie ma natywnego `make`. Rozwiązania:

```json
// package.json w root (uniwersalne, działa wszędzie)
{
  "scripts": {
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:build": "docker compose up -d --build",
    "docker:logs": "docker compose logs -f",
    "backend:console": "docker compose exec php php bin/console",
    "backend:test": "docker compose exec php php bin/phpunit",
    "backend:composer": "docker compose exec php composer",
    "frontend:dev": "docker compose exec node npm run dev",
    "frontend:test": "docker compose exec node npm test"
  }
}
```

Wtedy na obu platformach:
```bash
npm run docker:up
npm run backend:test
npm run frontend:dev
```

## .dockerignore

```
# .dockerignore
.git
.idea
.vscode
.cursor
node_modules
vendor
var/cache
var/log
*.md
!README.md
docker-compose*.yml
.env
.env.local
```

## Troubleshooting Cross-Platform

| Problem | Windows | Linux | Rozwiązanie |
|---------|---------|-------|-------------|
| Wolne volume mounts | Tak (NTFS→ext4) | Nie | Użyj WSL2 backend |
| Line ending errors | `\r\n` w kontenerze | Nie | `.gitattributes` z `eol=lf` |
| Permission denied | Raczej nie | Tak (UID mismatch) | `USER appuser` w Dockerfile |
| Port zajęty | `netstat -ano` | `ss -tulnp` | Zmień port w compose |
| Brak `make` | Brak natywnie | Jest | Użyj `npm scripts` |
| Docker socket | Docker Desktop | `/var/run/docker.sock` | Docker Desktop / Engine |

### Windows-Specific: Wydajność

```bash
# Sprawdź czy WSL2 backend jest włączony (KRYTYCZNE dla wydajności)
wsl --list --verbose
# Powinno pokazać "VERSION 2"

# Jeśli wolno: przechowuj repo wewnątrz WSL2 filesystem
# \\wsl$\Ubuntu\home\user\projects\  ← SZYBKO
# C:\Users\...\projects\              ← WOLNO z Docker volumes
```

## Best Practices

### ✅ DO

- **Używaj `docker compose` v2** (nie `docker-compose` v1)
- **Zawsze dodawaj `.gitattributes`** z `eol=lf`
- **Multi-stage builds** (dev/prod oddzielnie)
- **Named volumes** dla danych DB (nie bind mounts)
- **Healthchecks** na bazach danych
- **`.dockerignore`** żeby buildy były szybkie
- **`npm scripts`** zamiast Makefile (cross-platform)
- **Alpine images** gdzie to możliwe (mniejsze, szybsze)

### ❌ DON'T

- **Nie uruchamiaj PHP/Node/Postgres na hoście** - zawsze Docker
- **Nie zakładaj bash na hoście** - nie ma go na Windows
- **Nie używaj backslash** w docker-compose.yml
- **Nie commituj `docker-compose.override.yml`** (lokalne porty etc.)
- **Nie przechowuj danych DB w bind mount** (problemy z permissions)
- **Nie ignoruj `.gitattributes`** - to #1 przyczyna błędów cross-platform

## Resource Files

| File | Content | When to Reference |
|------|---------|-------------------|
| [DOCKER_COMPOSE.md](references/DOCKER_COMPOSE.md) | Pełne wzorce docker-compose, Nginx config, env files | Setup nowego projektu |
| [CROSS_PLATFORM.md](references/CROSS_PLATFORM.md) | Szczegóły Windows vs Linux, WSL2, permissions, performance | Debugowanie problemów OS-specific |

---

**Version:** 1.0  
**Last Updated:** 2026-02-16  
**Stack:** Docker 24+ | PHP 8.2 | PostgreSQL 16 | Node 20
