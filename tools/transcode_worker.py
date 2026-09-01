import json, subprocess, time, sys
from pathlib import Path

REPO = Path(sys.argv[1])
queue = json.load(open(REPO / "tools" / "transcode_queue.json"))
log = open(REPO / "tools" / "transcode_log.txt", "a")

def update_manifest(key, filename, ready=True):
    mpath = REPO / "js" / "manifest.json"
    m = json.load(open(mpath))
    for item in m.get(key, []):
        if item["src"].endswith(filename):
            item["ready"] = ready
    json.dump(m, open(mpath, "w"), indent=2)

for i, job in enumerate(queue):
    src, out, key, fname = job["src"], job["out"], job["key"], job["file"]
    log.write(f"[{i+1}/{len(queue)}] START {fname}\n"); log.flush()
    t0 = time.time()
    try:
        subprocess.run([
            "ffmpeg","-y","-i", src,
            "-vf","scale='min(1600,iw)':-2",
            "-c:v","libx264","-preset","veryfast","-crf","25",
            "-c:a","aac","-b:a","128k",
            "-movflags","+faststart",
            out
        ], check=True, capture_output=True, timeout=1800)
        update_manifest(key, fname, ready=True)
        log.write(f"[{i+1}/{len(queue)}] DONE {fname} ({time.time()-t0:.0f}s)\n")
    except Exception as e:
        log.write(f"[{i+1}/{len(queue)}] FAIL {fname}: {e}\n")
    log.flush()

log.write("ALL DONE\n"); log.flush()
