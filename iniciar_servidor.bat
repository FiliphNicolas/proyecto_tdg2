@echo off
title Servidor SystemsWare - Inventario

:menu
cls
echo ==========================================
echo     SERVIDOR SYSTEMSWARE - INVENTARIO
echo ==========================================
echo 1. Iniciar servidor
echo 2. Detener servidor
echo 3. Salir
echo ==========================================
set /p opcion=Seleccione una opcion (1-3): 

if "%opcion%"=="1" goto iniciar
if "%opcion%"=="2" goto detener
if "%opcion%"=="3" goto salir
echo Opcion no valida. Intente de nuevo.
pause
goto menu

:iniciar
cls
echo Iniciando servidor...
echo.
cd /d "c:\Users\nico\Desktop\systemsware\proyecto_tdg2"
start /B cmd /c "node server.js > servidor_log.txt 2>&1"
timeout /t 3 >nul

:verificar_inicio
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL%==0 (
    echo Servidor iniciado exitosamente!
    echo El servidor esta corriendo en http://localhost:3000
    echo.
    echo Abriendo pagina de inicio de sesion...
    start "" "http://localhost:3000/pages/iniciar-sesion.html"
    echo.
    echo Presione cualquier tecla para volver al menu...
    pause >nul
    goto menu
) else (
    echo Error al iniciar el servidor. Verificando logs...
    if exist servidor_log.txt (
        echo.
        echo === LOGS DEL SERVIDOR ===
        type servidor_log.txt
        echo.
    )
    echo Presione cualquier tecla para volver al menu...
    pause >nul
    goto menu
)

:detener
cls
echo Deteniendo servidor...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 >nul

:verificar_detencion
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL%==1 (
    echo Servidor detenido exitosamente!
    echo Presione cualquier tecla para volver al menu...
    pause >nul
    goto menu
) else (
    echo No se pudo detener el servidor. Intentando de nuevo...
    taskkill /F /IM node.exe /T
    timeout /t 2 >nul
    goto verificar_detencion
)

:salir
cls
echo Cerrando menu del servidor...
timeout /t 1 >nul
exit
