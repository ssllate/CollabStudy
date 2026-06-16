@echo off
title CollabStudy — Сборка .exe
color 0A

:: Переходим в папку где лежит BUILD.bat (на случай запуска из другого места)
cd /d "%~dp0"

echo.
echo  =======================================
echo   CollabStudy -- Сборка .exe файла
echo  =======================================
echo.

:: Проверяем Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Node.js не найден!
    echo Скачайте с https://nodejs.org и установите, затем запустите снова.
    pause
    exit /b 1
)

echo [1/3] Устанавливаем зависимости...
call npm install
if errorlevel 1 (
    echo [ОШИБКА] npm install завершился с ошибкой
    pause
    exit /b 1
)

echo.
echo [2/3] Собираем .exe (это займет 1-2 минуты)...
call npx electron-builder --win --x64
if errorlevel 1 (
    echo [ОШИБКА] Сборка завершилась с ошибкой
    pause
    exit /b 1
)

echo.
echo [3/3] Готово!
echo.
echo  Файлы в папке dist\:
echo   TAB CollabStudy Setup 1.0.0.exe  -- установщик
echo   TAB CollabStudy 1.0.0.exe        -- portable
echo.
explorer dist
pause
