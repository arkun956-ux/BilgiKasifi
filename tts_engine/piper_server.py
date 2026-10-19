#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bilgi Kâşifi - Piper Nöral TTS Yerel HTTP Köprüsü (127.0.0.1:5005)
Not: Sistemde Python kuruluysa doğrudan çalıştırılabilir; ayrıca sıfır bağımlılık için
PiperServer.cs üzerinden derlenen yerel piper_server.exe ikili dosyası da mevcuttur.
"""
import json
import os
import subprocess
import tempfile
import threading
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PIPER_EXE = os.path.join(BASE_DIR, "piper", "piper.exe")
DEFAULT_MODEL = "tr_TR-fahrettin-medium"


class PersistentPiper:
    def __init__(self, model_name=DEFAULT_MODEL):
        self.model_name = model_name
        self.model_path = os.path.join(BASE_DIR, f"{model_name}.onnx")
        self.lock = threading.Lock()
        self.proc = None
        self._start()

    def _start(self):
        self.proc = subprocess.Popen(
            [
                PIPER_EXE,
                "--model", self.model_path,
                "--length_scale", "1.06",
                "--noise_scale", "0.65",
                "--noise_w", "0.8",
                "--json-input"
            ],
            cwd=os.path.dirname(PIPER_EXE),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            bufsize=1,
        )

    def synthesize(self, text: str) -> bytes:
        with self.lock:
            if self.proc is None or self.proc.poll() is not None:
                self._start()
            wav_path = os.path.join(tempfile.gettempdir(), f"piper_{uuid.uuid4().hex}.wav")
            payload = json.dumps({"text": text, "output_file": wav_path}, ensure_ascii=False)
            self.proc.stdin.write(payload + "\n")
            self.proc.stdin.flush()
            self.proc.stdout.readline()
            with open(wav_path, "rb") as f:
                data = f.read()
            try:
                os.remove(wav_path)
            except OSError:
                pass
            return data


ENGINE = None


class TTSHandler(BaseHTTPRequestHandler):
    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/status", "/health", "/"):
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "engine": "piper-neural-tts"}).encode("utf-8"))
            return

        if parsed.path == "/tts":
            qs = parse_qs(parsed.query)
            text = qs.get("text", [""])[0]
            self._synthesize_and_respond(text)
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if self.path.startswith("/tts"):
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body) if body else {}
            self._synthesize_and_respond(data.get("text", ""))
            return
        self.send_response(404)
        self.end_headers()

    def _synthesize_and_respond(self, text: str):
        if not text.strip():
            self.send_response(400)
            self._send_cors()
            self.end_headers()
            return
        wav_bytes = ENGINE.synthesize(text)
        self.send_response(200)
        self._send_cors()
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(wav_bytes)))
        self.end_headers()
        self.wfile.write(wav_bytes)


if __name__ == "__main__":
    ENGINE = PersistentPiper(DEFAULT_MODEL)
    ENGINE.synthesize("Merhaba")
    server = HTTPServer(("127.0.0.1", 5005), TTSHandler)
    print("Piper TTS Server listening on http://127.0.0.1:5005")
    server.serve_forever()
