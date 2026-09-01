import os, re, json, subprocess, shutil
from pathlib import Path

SRC = Path(os.environ["SRC_DIR"])
REPO = Path(os.environ["REPO_DIR"])
WORK = REPO / "assets" / "work"
WORK.mkdir(parents=True, exist_ok=True)

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
GIF_EXT = {".gif"}
VID_EXT = {".mp4",".mov",".MOV",".MP4"}

def slugfile(name):
    base, ext = os.path.splitext(name)
    base = re.sub(r"[^a-zA-Z0-9]+","-", base).strip("-").lower()
    return base, ext.lower()

def order_of(name):
    m = re.match(r"^0*(\d+)[_\s-]", name)
    return int(m.group(1)) if m else 999

manifest = {}
queue = []

def process_folder(src_folder, out_key):
    items = []
    out_dir = WORK / out_key
    out_dir.mkdir(parents=True, exist_ok=True)
    files = [f for f in sorted(src_folder.iterdir()) if f.is_file() and not f.name.startswith(".")]
    for f in files:
        base, ext = slugfile(f.name)
        order = order_of(f.name)
        if ext in IMG_EXT:
            out_name = f"{base}.jpg"
            out_path = out_dir / out_name
            try:
                subprocess.run(["ffmpeg","-y","-i",str(f),"-vf","scale='min(2400,iw)':-2","-q:v","4", str(out_path)],
                                check=True, capture_output=True, timeout=60)
            except Exception:
                shutil.copy2(f, out_path)
            items.append({"type":"image","src":f"assets/work/{out_key}/{out_name}","order":order,"origSize":f.stat().st_size})
        elif ext in GIF_EXT:
            out_name = f"{base}.gif"
            out_path = out_dir / out_name
            shutil.copy2(f, out_path)
            items.append({"type":"gif","src":f"assets/work/{out_key}/{out_name}","order":order,"origSize":f.stat().st_size})
        elif ext in VID_EXT:
            out_name = f"{base}.mp4"
            poster_name = f"{base}-poster.jpg"
            out_path = out_dir / out_name
            poster_path = out_dir / poster_name
            try:
                subprocess.run(["ffmpeg","-y","-ss","1","-i",str(f),"-frames:v","1","-vf","scale='min(1600,iw)':-2", str(poster_path)],
                                check=True, capture_output=True, timeout=60)
            except Exception:
                pass
            items.append({"type":"video","src":f"assets/work/{out_key}/{out_name}",
                          "poster":f"assets/work/{out_key}/{poster_name}" if poster_path.exists() else None,
                          "order":order,"origSize":f.stat().st_size,"ready":False})
            queue.append({"src":str(f),"out":str(out_path),"key":out_key,"file":out_name})
    items.sort(key=lambda x: x["order"])
    manifest[out_key] = items

for folder in sorted(SRC.iterdir()):
    if not folder.is_dir(): continue
    name = folder.name
    if name in SECTIONS:
        process_folder(folder, f"_hero-{SECTIONS[name]}")
    elif name in SUBSECTIONS:
        sec, sub = SUBSECTIONS[name]
        process_folder(folder, f"{sec}/{sub}")
    else:
        print("UNMAPPED:", name)

(REPO / "js").mkdir(exist_ok=True)
with open(REPO / "js" / "manifest.json","w") as f:
    json.dump(manifest, f, indent=2)
with open(REPO / "tools" / "transcode_queue.json","w") as f:
    json.dump(queue, f, indent=2)

print("DONE. sections:", len(manifest), "videos queued:", len(queue))
