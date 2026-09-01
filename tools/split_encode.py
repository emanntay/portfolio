import json, subprocess, sys, time
from pathlib import Path

REPO = Path(sys.argv[1])
idx = int(sys.argv[2])
queue = json.load(open(REPO / "tools" / "transcode_queue.json"))
job = queue[idx]
src, out = job["src"], job["out"]
tmp_dir = Path("/tmp/split_" + str(idx))
tmp_dir.mkdir(exist_ok=True)

dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1", src],
                            capture_output=True, text=True).stdout.strip())
half = dur / 2

parts = []
for i, (start, length) in enumerate([(0, half), (half, dur-half)]):
    part_out = tmp_dir / f"part{i}.mp4"
    t0 = time.time()
    subprocess.run([
        "ffmpeg","-y","-ss", str(start), "-i", src, "-t", str(length),
        "-vf","scale='min(1280,iw)':-2",
        "-c:v","libx264","-preset","veryfast","-crf","26",
        "-c:a","aac","-b:a","112k",
        str(part_out)
    ], check=True, capture_output=True, timeout=175)
    parts.append(part_out)
    print(f"part{i} done in {time.time()-t0:.0f}s")

concat_list = tmp_dir / "list.txt"
concat_list.write_text("\n".join(f"file '{p}'" for p in parts))
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(concat_list),
                 "-c","copy","-movflags","+faststart", out], check=True, capture_output=True, timeout=60)
print("CONCAT DONE ->", out)

mpath = REPO / "js" / "manifest.json"
m = json.load(open(mpath))
for item in m.get(job["key"], []):
    if item["src"].endswith(job["file"]):
        item["ready"] = True
json.dump(m, open(mpath, "w"), indent=2)
print("manifest updated")
