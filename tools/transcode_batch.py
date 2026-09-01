import json, subprocess, time, sys
from pathlib import Path

REPO = Path(sys.argv[1])
indices = [int(x) for x in sys.argv[2:]]
queue = json.load(open(REPO / "tools" / "transcode_queue.json"))

def update_manifest(key, filename):
    mpath = REPO / "js" / "manifest.json"
    m = json.load(open(mpath))
    for item in m.get(key, []):
        if item["src"].endswith(filename):
            item["ready"] = True
    json.dump(m, open(mpath, "w"), indent=2)

for i in indices:
    job = queue[i]
    src, out, key, fname = job["src"], job["out"], job["key"], job["file"]
    t0 = time.time()
    try:
        subprocess.run([
            "ffmpeg","-y","-i", src,
            "-vf","scale='min(1280,iw)':-2",
            "-c:v","libx264","-preset","veryfast","-crf","26",
            "-c:a","aac","-b:a","112k",
            "-movflags","+faststart",
            out
        ], check=True, capture_output=True, timeout=170)
        update_manifest(key, fname)
        print(f"[{i}] DONE {fname} ({time.time()-t0:.0f}s)")
    except subprocess.TimeoutExpired:
        print(f"[{i}] TIMEOUT {fname} (>{time.time()-t0:.0f}s)")
    except Exception as e:
        print(f"[{i}] FAIL {fname}: {e}")
