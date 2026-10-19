#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bilgi Kâşifi - Tam Kapsamlı ARASAAC Türkçe Piktogram İndirme ve İndeksleme Betiği
ARASAAC veri tabanındaki TÜM Türkçe piktogramları (~13.500+ görsel)
25 paralel iş parçacığı (ThreadPoolExecutor max_workers=25) ile indirir ve
tüm Türkçe anahtar kelimeleri/eş anlamlıları assets/arasaac/arasaac_tr_index.json
dosyasına eksiksiz olarak kaydeder.
"""

import json
import os
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARASAAC_DIR = os.path.join(BASE_DIR, "assets", "arasaac")
CATALOG_URLS = [
    "https://api.arasaac.org/api/pictograms/all/tr",
    "https://api.arasaac.org/v1/pictograms/all/tr",
]
STATIC_PNG_URL = "https://static.arasaac.org/pictograms/{pid}/{pid}_300.png"
MAX_WORKERS = 25


def normalize_tr(text: str) -> str:
    if not text:
        return ""
    # Türkçe İ/I duyarlı küçük harf dönüşümü
    return text.replace("İ", "i").replace("I", "ı").strip().lower()


def fetch_catalog():
    for url in CATALOG_URLS:
        try:
            print(f"[ARASAAC] Katalog çekiliyor: {url}")
            req = urllib.request.Request(url, headers={"User-Agent": "BilgiKasifi/2.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[Uyarı] {url} başarısız ({e}), alternatif deneniyor...")
    raise RuntimeError("ARASAAC Türkçe kataloğu alınamadı!")


def download_single_pictogram(pid: int) -> bool:
    out_file = os.path.join(ARASAAC_DIR, f"{pid}.png")
    if os.path.exists(out_file) and os.path.getsize(out_file) > 100:
        return True

    url = STATIC_PNG_URL.format(pid=pid)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "BilgiKasifi/2.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
                if len(data) > 100:
                    with open(out_file, "wb") as f:
                        f.write(data)
                    return True
        except Exception:
            pass
    return False


def main():
    os.makedirs(ARASAAC_DIR, exist_ok=True)
    catalog = fetch_catalog()
    print(f"[ARASAAC] Toplam {len(catalog)} piktogram meta verisi alındı.")

    index_map = {}
    all_pids = []
    seen_pids = set()

    for item in catalog:
        pid = item.get("_id")
        if not pid:
            continue
        if pid not in seen_pids:
            seen_pids.add(pid)
            all_pids.append(pid)

        filename = f"{pid}.png"
        for kw_obj in item.get("keywords", []):
            kw = normalize_tr(kw_obj.get("keyword", ""))
            if kw and kw not in index_map:
                index_map[kw] = filename
            plural = normalize_tr(kw_obj.get("plural", ""))
            if plural and plural not in index_map:
                index_map[plural] = filename

    # 1. Tam Türkçe arama indeksini kaydet (JSON + file:// uyumlu JS)
    index_json_path = os.path.join(ARASAAC_DIR, "arasaac_tr_index.json")
    with open(index_json_path, "w", encoding="utf-8") as f:
        json.dump(index_map, f, ensure_ascii=False, separators=(",", ":"))

    index_js_path = os.path.join(ARASAAC_DIR, "arasaac_tr_index.js")
    with open(index_js_path, "w", encoding="utf-8") as f:
        f.write("window.ARASAAC_FULL_INDEX = ")
        json.dump(index_map, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    print(
        f"[İndeks] {len(index_map)} Türkçe anahtar kelime / eş anlamlı '{index_json_path}' dosyasına kaydedildi."
    )

    # 2. 25 paralel iş parçacığı ile tüm piktogramları indir
    total = len(all_pids)
    completed = 0
    lock = threading.Lock()

    print(f"[İndirme Başladı] {total} piktogram {MAX_WORKERS} paralel kanal ile indiriliyor...")
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(download_single_pictogram, pid) for pid in all_pids]
        for _ in as_completed(futures):
            with lock:
                completed += 1
                if completed % 500 == 0 or completed == total:
                    print(f"[İlerleme] {completed} / {total} piktogram indirildi...")

    print(f"[Tamamlandı] {total} ARASAAC piktogramı ve Türkçe indeks hazır!")


if __name__ == "__main__":
    main()
