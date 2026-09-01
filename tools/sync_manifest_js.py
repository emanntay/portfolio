import json
from pathlib import Path
REPO = Path(__file__).resolve().parents[1]
data = json.load(open(REPO / "js" / "manifest.json"))
with open(REPO / "js" / "manifest.js", "w") as f:
    f.write("window.MANIFEST = ")
    json.dump(data, f)
    f.write(";\n")
print("synced")
