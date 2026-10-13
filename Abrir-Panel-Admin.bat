@echo off
setlocal
title Panel Admin - Mike Portfolio
cd /d "%~dp0"

echo ============================================
echo  Panel de administracion - Mike Portfolio
echo  (solo local, nunca se publica)
echo ============================================
echo.

REM 1) Dependencias (solo la primera vez)
if not exist "node_modules" (
  echo [1/4] Instalando dependencias, espera...
  call npm install
  echo.
) else (
  echo [1/4] Dependencias OK.
)

REM 2) Servidor dev si no esta corriendo ya
powershell -NoProfile -Command "try { if ((Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
  echo [2/4] Iniciando servidor local en ventana aparte...
  start "Servidor Mike-Portfolio" cmd /c "npm run dev -- --host --port 5173"
) else (
  echo [2/4] Servidor ya en marcha, se reutiliza.
)

REM 3) Esperar a que responda (max ~60 segundos)
echo [3/4] Esperando al servidor...
powershell -NoProfile -Command "$t=0; while ($t -lt 60) { try { if ((Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 2; $t+=2 }; exit 1" >nul 2>&1

if %errorlevel% neq 0 (
  echo.
  echo ERROR: el servidor no respondio en 60s.
  echo Revisa la ventana "Servidor Mike-Portfolio" por si hay un error.
  pause
  exit /b 1
)

REM 4) Abrir el panel en el navegador
echo [4/4] Abriendo panel de administracion...
start "" "http://localhost:5173/#/admin"
echo.
echo Listo. Contrasena por defecto: mike123
echo No cierres la ventana del servidor mientras uses el panel.
echo (Para detenerlo todo, cierra ambas ventanas.)
pause
