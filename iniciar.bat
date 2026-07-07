@echo off
REM Inicia toda a aplicacao Ramuza Nexus (frontend, backend, postgres, redis) via Docker Compose
cd /d "%~dp0docker"
docker compose up --build
