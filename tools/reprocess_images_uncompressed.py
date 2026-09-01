import os, re, json, shutil
from pathlib import Path

SRC = Path(os.environ["SRC_DIR"])
REPO = Path(os.environ["REPO_DIR"])
WORK = REPO / "assets" / "work"

SECTIONS = {
  "01 Genius Brand Partnerships": "genius-branded-partnerships",
  "02 Genius Brand": "genius-brand",
  "03 Genius IQ:BBQ + The 50th": "iqbbq-50th",
  "04 adidas women nyc": "adidas-women-nyc",
}
SUBSECTIONS = {
  "01a jordan": ("genius-branded-partnerships","jordan"),
  "01b brisk": ("genius-branded-partnerships","brisk"),
  "01c RABANNE HOLIDAY": ("genius-branded-partnerships","rabanne-holiday"),
  "01d TURBOTAX": ("genius-branded-partnerships","turbotax"),
  "01e RABANNE FATHERS DAY": ("genius-branded-partnerships","rabanne-fathers-day"),
  "01f new series": ("genius-branded-partnerships","new-branded-series"),
  "02a EDITORIAL": ("genius-brand","editorial"),
  "02c COMMUNITY": ("genius-brand","community"),
  "02d MUSIC IQ": ("genius-brand","music-iq"),
  "02e presentations and strategy": ("genius-brand","presentations-strategy"),
  "03a iqbbq design": ("iqbbq-50th","iqbbq-design"),
  "03b iqbbq promotion": ("iqbbq-50th","iqbbq-promotion"),
  "03c iqbbq event": ("iqbbq-50th","iqbbq-event"),
  "03d iqbbq brand partners": ("iqbbq-50th","iqbbq-brand-partners"),
  "03e 50th content hub": ("iqbbq-50th","50th-content-hub"),
  "04a Superstar Celebration at Beyond the Streets": ("adidas-women-nyc","superstar-celebration"),
  "04b US Open Watch Party": ("adidas-women-nyc","us-open-watch-party"),
  "04c boost your morning": ("adidas-women-nyc","boost-your-morning"),
  "04d  Supercourt @ Museum of Ice Cream": ("adidas-women-nyc","supercourt-moic"),
}
IMG_EXT = {".jpg",".jpeg",".png",".JPG",".PNG",".JPEG"}

def slugfile(name):
    base, ext = os.path.splitext(name)
    base = re.sub(r"[^a-zA-Z0-9]+","-", base).strip("-").lower()
    return base, ext.lower()

def order_of(name):
    m = re.match(r"^0*(\d+)[_\s-]", name)
    return int(m.group(1)) if m else 999

manifest = json.load(open(REPO / "js" / "manifest.json"))

def reprocess(src_folder, out_key):
    out_dir = WORK / out_key
    out_dir.mkdir(parents=True, exist_ok=True)
    files = [f for f in sorted(src_folder.iterdir()) if f.is_file() and not f.name.startswith(".")]
    new_items = []
    for f in files:
        base, ext = slugfile(f.name)
        order = order_of(f.name)
        if ext in IMG_EXT:
            out_ext = ".jpg" if ext in (".jpg",".jpeg") else ext
            out_name = f"{base}{out_ext}"
            out_path = out_dir / out_name
            shutil.copy2(f, out_path)
            new_items.append({"type":"image","src":f"assets/work/{out_key}/{out_name}","order":order,"origSize":f.stat().st_size})
    # merge: replace image entries, keep gif/video entries as-is
    old = manifest.get(out_key, [])
    kept = [it for it in old if it["type"] != "image"]
    merged = kept + new_items
    merged.sort(key=lambda x: x["order"])
    manifest[out_key] = merged

for folder in sorted(SRC.iterdir()):
    if not folder.is_dir(): continue
    name = folder.name
    if name in SECTIONS:
        reprocess(folder, f"_hero-{SECTIONS[name]}")
    elif name in SUBSECTIONS:
        sec, sub = SUBSECTIONS[name]
        reprocess(folder, f"{sec}/{sub}")

json.dump(manifest, open(REPO / "js" / "manifest.json","w"), indent=2)
print("reprocessed images, uncompressed copies written")
