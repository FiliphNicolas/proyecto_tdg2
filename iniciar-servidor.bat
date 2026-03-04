@echo off
REM Iniciador automático para Systemsware
REM Este script inicia el servidor Node.js

echo.
echo.
echo ========================================
echo    🚀 INICIANDO SYSTEMSWARE SERVER
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Para instalar Node.js:
    echo 1. Ve a https://nodejs.org/
    echo 2. Descarga la versión LTS
    echo 3. Instala y reinicia la terminal
    echo.
    pause
    exit /b 1
)

REM Verificar si npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias (primera ejecución)...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
    echo.
)

REM Iniciar el servidor
echo 🔌 Iniciando servidor en puerto 3000...
echo.
echo ═══════════════════════════════════════════════════════════
echo.
call npm start

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al iniciar el servidor
    pause
    exit /b 1
)
