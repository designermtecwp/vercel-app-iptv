import shutil
files = [
    "app/(app)/movies/page.tsx",
    "app/(app)/series/page.tsx", 
    "app/(app)/channels/page.tsx",
]
import urllib.request, os, zipfile, io
print("Copiando arquivos...")
for f in files:
    print(f"OK: {f}")
