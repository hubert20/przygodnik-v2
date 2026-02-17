# Cross-Platform: Windows vs Linux

Szczegółowy przewodnik rozwiązywania problemów cross-platform w zespole gdzie część osób pracuje na Windows, a część na Linux.

## Zasada Naczelna

> **Kod żyje w kontenerach Linux. Host OS to tylko edytor + Docker.**
> Nigdy nie uruchamiaj PHP, Node, PostgreSQL bezpośrednio na hoście.

## Line Endings (CRLF vs LF)

### Problem

- Windows: `\r\n` (CRLF)
- Linux/macOS/Docker: `\n` (LF)
- Dockerfile `RUN` script z `\r\n` = **crash**: `/bin/bash^M: bad interpreter`

### Rozwiązanie: .gitattributes (OBOWIĄZKOWE)

```gitattributes
# Wymusza LF na WSZYSTKICH plikach tekstowych
* text=auto eol=lf

# Explicitnie dla plików krytycznych
*.sh text eol=lf
*.php text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
*.json text eol=lf
*.js text eol=lf
*.ts text eol=lf
*.vue text eol=lf
*.conf text eol=lf
*.sql text eol=lf
*.env text eol=lf
Dockerfile text eol=lf
Makefile text eol=lf

# Binarne - nie ruszaj
*.png binary
*.jpg binary
*.gif binary
*.woff binary
*.woff2 binary
```

### Git Config (każdy dev na Windows)

```bash
# WAŻNE: Ustaw core.autocrlf na input (nie na true!)
git config --global core.autocrlf input

# Jeśli repo już ma CRLF, napraw:
git rm --cached -r .
git reset --hard
```

### IDE Settings

**VS Code / Cursor:**
```json
{
  "files.eol": "\n"
}
```

Dodaj do `.vscode/settings.json` w repo żeby było automatyczne.

## File Permissions

### Problem

- Linux: pliki mają `chmod` permissions (755, 644 etc.)
- Windows NTFS: nie ma native chmod, Git emuluje
- Docker volume z Windows = pliki mogą mieć wrong permissions

### Rozwiązanie

```dockerfile
# W Dockerfile: eksplicytnie ustaw usera i permissions
RUN adduser -D appuser
RUN chown -R appuser:appuser /app
USER appuser
```

```yaml
# W docker-compose.yml: NIE montuj jako root
services:
  php:
    user: "1000:1000"  # Opcjonalnie na Linux
```

### Skrypty Shell

```bash
# Commituj z executable bit (raz, na Linux lub Git Bash)
git update-index --chmod=+x scripts/setup.sh

# Na Windows to nie ma efektu na hoście,
# ale Git zachowa bit i w kontenerze będzie działać
```

## Shell / Terminal

### Problem

- Windows: PowerShell, cmd.exe (nie bash)
- Linux: bash, zsh, sh
- Komendy różne: `ls` vs `dir`, `cp` vs `copy`, `rm` vs `del`

### Rozwiązanie: Docker Compose jako Abstraction Layer

```bash
# Te komendy działają IDENTYCZNIE na obu platformach:
docker compose up -d
docker compose exec php bash
docker compose exec php php bin/console cache:clear
docker compose exec node npm install
```

### Skrypty NPM (Cross-Platform)

```json
{
  "scripts": {
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:build": "docker compose up -d --build",
    "docker:shell:php": "docker compose exec php bash",
    "docker:shell:node": "docker compose exec node sh",
    "db:migrate": "docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction",
    "db:reset": "docker compose exec php php bin/console doctrine:database:drop --force --if-exists && docker compose exec php php bin/console doctrine:database:create && docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction",
    "test:backend": "docker compose exec php php bin/phpunit",
    "test:frontend": "docker compose exec node npm test",
    "lint:php": "docker compose exec php composer cs-fix",
    "lint:js": "docker compose exec node npm run lint"
  }
}
```

### Unikaj w Skryptach

```bash
# ❌ BAD: Nie działa na Windows
#!/bin/bash
source .env
export $(cat .env | xargs)

# ✅ GOOD: Docker sam czyta .env
# docker-compose.yml
env_file:
  - .env
```

## Ścieżki (Paths)

### Problem

- Windows: `C:\Users\mlacki\project\backend`
- Linux: `/home/user/project/backend`
- Docker Compose: wymaga forward slash `/`

### Rozwiązanie

```yaml
# ✅ GOOD: Relative path z forward slash (działa wszędzie)
volumes:
  - ./backend:/app
  - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf

# ❌ BAD: Absolute Windows path
volumes:
  - C:\Users\mlacki\project\backend:/app

# ❌ BAD: Backslash
volumes:
  - .\backend:/app
```

W kodzie PHP/JS - używaj `DIRECTORY_SEPARATOR` lub forward slash:
```php
// ✅ GOOD: Forward slash (działa na obu OS w kontenerze Linux)
$path = '/app/var/cache';

// Ale w kodzie który MOŻE działać na hoście:
$path = __DIR__ . DIRECTORY_SEPARATOR . 'cache';
```

## Docker Performance

### Windows (Docker Desktop + WSL2)

**Konfiguracja WSL2 (WAŻNE!):**

1. Docker Desktop → Settings → General → "Use the WSL 2 based engine" ✅
2. Docker Desktop → Settings → Resources → WSL Integration → Enable for your distro

**Problemy z wydajnością volumeów:**

```
Prędkość I/O (orientacyjna):
- Linux native:           ~100% (baseline)
- WSL2 filesystem:        ~90%  (prawie natywna)
- Windows NTFS via WSL2:  ~30%  (WOLNO!)
```

**Rozwiązanie dla dużych projektów:**
```bash
# Opcja 1: Przechowuj projekt wewnątrz WSL2 (najszybsza)
# Otwórz WSL terminal:
cd /home/user/projects/  # ← TU trzymaj projekt
# W Cursor/VS Code: "Remote - WSL" extension

# Opcja 2: Exclude vendor/node_modules z bind mount
# (już zrobione w naszym docker-compose.yml z named volumes)
```

**`.wslconfig` (opcjonalnie - w `%USERPROFILE%\.wslconfig`):**
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

### Linux (Docker Engine)

Performance jest natywna. Jedyny problem:

**UID/GID mismatch:**
```bash
# Sprawdź swój UID
id -u  # np. 1000

# Jeśli pliki tworzone w kontenerze mają innego właściciela:
# Dodaj w docker-compose.yml:
services:
  php:
    user: "${UID:-1000}:${GID:-1000}"
```

## Environment Variables

### .env File

```bash
# .env.example (w repo - template)
# .env         (NIE w repo - lokalne wartości)

# Cross-platform safe: nie używaj spacji wokół =
DATABASE_URL=postgresql://app:secret@postgres:5432/app_db
APP_ENV=dev

# ❌ BAD: Spacje (mogą powodować problemy)
DATABASE_URL = postgresql://app:secret@postgres:5432/app_db
```

### Windows: Zmienne środowiskowe

```powershell
# PowerShell - jednorazowe
$env:COMPOSE_PROJECT_NAME = "myproject"

# Stałe: Docker Desktop obsługuje .env automatycznie
```

### Linux: Zmienne środowiskowe

```bash
# Bash
export COMPOSE_PROJECT_NAME=myproject

# Lub w .env (Docker Compose czyta automatycznie)
```

## Checklist Nowego Dewelopera

### Windows Developer Setup

- [ ] Zainstaluj Docker Desktop
- [ ] Włącz WSL2 backend w Docker Desktop
- [ ] Zainstaluj WSL2 distro (Ubuntu recommended)
- [ ] `git config --global core.autocrlf input`
- [ ] Ustaw IDE na LF line endings
- [ ] Sklonuj repo: `git clone ...`
- [ ] `cp .env.example .env`
- [ ] `docker compose up -d --build`
- [ ] `docker compose exec php composer install`
- [ ] `docker compose exec node npm install`
- [ ] Sprawdź: http://localhost:8080

### Linux Developer Setup

- [ ] Zainstaluj Docker Engine + Docker Compose v2
- [ ] Dodaj siebie do grupy `docker`: `sudo usermod -aG docker $USER`
- [ ] Sklonuj repo: `git clone ...`
- [ ] `cp .env.example .env`
- [ ] `docker compose up -d --build`
- [ ] `docker compose exec php composer install`
- [ ] `docker compose exec node npm install`
- [ ] Sprawdź: http://localhost:8080

## Typowe Błędy i Rozwiązania

### "exec format error" lub "/bin/sh^M: bad interpreter"

**Przyczyna:** CRLF line endings w skryptach shell.
```bash
# Fix:
git rm --cached -r .
git reset --hard
# Upewnij się że .gitattributes ma eol=lf
```

### "Permission denied" przy composer install/npm install

**Windows:** Zazwyczaj nie problem (Docker Desktop zarządza permissions).
**Linux:**
```bash
# Sprawdź ownership volumeów
docker compose exec php ls -la /app/vendor
# Fix: dodaj user w docker-compose.yml lub Dockerfile
```

### "Port already in use"

```bash
# Windows:
netstat -ano | findstr :8080
taskkill /PID <pid> /F

# Linux:
ss -tulnp | grep :8080
kill <pid>

# Lub zmień port w .env:
NGINX_PORT=8090
```

### Wolne `composer install` / `npm install`

**Windows:** Upewnij się że vendor/node_modules są w named volumes (nie w bind mount).
```yaml
volumes:
  - backend_vendor:/app/vendor       # Named volume = szybko
  # NIE: - ./backend/vendor:/app/vendor  # Bind mount = wolno na Windows
```

### Docker Compose v1 vs v2

```bash
# ❌ V1 (deprecated, nie używaj)
docker-compose up -d

# ✅ V2 (plugin, używaj tego)
docker compose up -d

# Sprawdź wersję:
docker compose version
# Docker Compose version v2.x.x
```

---

**Version:** 1.0  
**Last Updated:** 2026-02-16
