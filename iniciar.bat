@echo off
REM Inicia toda a aplicacao PesoHub (frontend, backend, postgres, redis) via Docker Compose
cd /d "%~dp0docker"
docker compose up --build
