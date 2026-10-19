@echo off
title Bilgi Kasifi - Ilgi Merkezi ve Piper Noral Ses Motoru
chcp 65001 >nul

:: 1. Piper Nöral TTS Sunucusu Kontrolü (http://127.0.0.1:5005)
tasklist /fi "imagename eq piper_server.exe" | find /i "piper_server.exe" >nul
if errorlevel 1 (
    echo [1/3] Piper Noral Turkce Ses Motoru ^(127.0.0.1:5005^) baslatiliyor...
    powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'C:\Users\90507\Desktop\BilgiKasifi_Uygulamasi\tts_engine\piper_server.exe' -WorkingDirectory 'C:\Users\90507\Desktop\BilgiKasifi_Uygulamasi\tts_engine' -WindowStyle Hidden"
    timeout /t 1 /nobreak >nul
)

:: 2. Ollama Kontrolü (Arka planda çalışmıyorsa başlat)
tasklist /fi "imagename eq ollama.exe" | find /i "ollama.exe" >nul
if errorlevel 1 (
    echo [2/3] Ollama yerel yapay zeka servisi baslatiliyor...
    start "" /b "C:\Users\90507\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 2 /nobreak >nul
)

:: 3. Chrome veya Edge ile Güvenli Localhost (http://127.0.0.1:5005) Üzerinden Kiosk Modunda Aç
echo [3/3] Bilgi Kasifi tam ekran kiosk arayuzu aciliyor...
set "APP_URL=http://127.0.0.1:5005/index.html"
set "KIOSK_ARGS=--app=%APP_URL% --start-fullscreen --kiosk --user-data-dir=%TEMP%\BilgiKasifiKiosk --no-first-run --disable-pinch --use-fake-ui-for-media-stream"

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" %KIOSK_ARGS%
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" %KIOSK_ARGS%
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" %KIOSK_ARGS%
) else (
    start "" %APP_URL%
)

echo.
echo ====================================================================
echo   BILGI KASIFI AKTIF! (Ollama + Piper Noral TTS: 127.0.0.1:5005)
echo   Uygulamayi kullandiktan sonra ses servisini temizce kapatmak icin
echo   bu pencerede herhangi bir tusa basabilirsiniz.
echo ====================================================================
pause >nul

echo Piper Noral TTS servisi kapatiliyor...
taskkill /f /im piper_server.exe >nul 2>&1
taskkill /f /im piper.exe >nul 2>&1
exit
