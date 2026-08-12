@echo off
REM PesoHub Agent Local - atalho de instalacao
REM Duplo-clique aqui: pede elevacao (UAC) e ignora bloqueio de execution policy do PowerShell.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0install.ps1\"' -Verb RunAs"
