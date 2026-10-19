@echo off
set "APP_URL=http://localhost:5500"

:: Eger port 5500 acik degilse ve yerel Piper sunucusu 5005 aktifse otomatik 5005'i kullan
powershell -NoProfile -Command "try { $c = [System.Net.Sockets.TcpClient]::new('127.0.0.1', 5500); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    set "APP_URL=http://127.0.0.1:5005/index.html"
)

start "" chrome --app="%APP_URL%" --start-fullscreen --kiosk --user-data-dir="%TEMP%\BilgiKasifiKiosk" --no-first-run --disable-pinch
if %errorlevel% neq 0 (
    start "" msedge --app="%APP_URL%" --start-fullscreen --kiosk --user-data-dir="%TEMP%\BilgiKasifiKiosk" --no-first-run --disable-pinch
)
exit
