@echo off
title Instalar y ejecutar SystemsWare

REM Cambiar al directorio donde se encuentra este archivo
cd /d "%~dp0"

echo ==========================================
echo   INSTALACION Y EJECUCION SYSTEMSWARE
echo ==========================================

REM Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado.
  echo Descargue e instale Node.js desde https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm no esta instalado.
  echo Instale Node.js para obtener npm.
  pause
  exit /b 1
)

echo Node.js y npm detectados.

echo Instalando dependencias...
npm install
if errorlevel 1 (
  echo ERROR: npm install falló.
  echo Verifique su conexion a Internet y ejecute este archivo de nuevo.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo Se ha creado el archivo .env desde .env.example.
    echo Edite .env con los datos de su base de datos PostgreSQL.
  ) else (
    echo No se encontro .env.example. Cree un archivo .env con la configuracion necesaria.
  )
) else (
  echo Archivo .env ya existe.
)

echo.
echo PASO IMPORTANTE: debe crear la base de datos en PostgreSQL e importar el esquema SQL.
echo Use los archivos en la carpeta sql\ para inicializar la base de datos.
echo.
pause

echo Iniciando servidor...
start "" cmd /c "node server.js > servidor_log.txt 2>&1"

ping -n 4 127.0.0.1 >nul

echo.
echo El servidor se esta ejecutando. Abre http://localhost:3000 en tu navegador.
echo Puede revisar los logs en servidor_log.txt.
pause
exit /b 0
