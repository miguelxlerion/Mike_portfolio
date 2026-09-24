import json, pathlib
p = pathlib.Path('data/portfolio.json')
j = json.loads(p.read_text(encoding='utf-8'))
bg = j['threeDPage']['background']
# Add lights triad
if 'lights' not in bg:
    bg['lights'] = [
        {"type": "hemisphere", "color": "#ffffff", "groundColor": "#0a0e18", "intensity": 1.0, "enabled": True},
        {"type": "directional", "color": "#8ab4ff", "intensity": 1.2, "position": [6,10,4], "enabled": True},
        {"type": "point", "color": "#a855f7", "intensity": 1.0, "position": [-4,4,-2], "distance": 20, "enabled": True}
    ]
    print("added lights triad")
# Add material mode
if 'materialMode' not in bg:
    bg['materialMode'] = "original"
    print("added materialMode")
# Add toggles for default figures
for key, default in [("showParticles", True), ("showLines", True), ("showTorus", True), ("showIco", True)]:
    if key not in bg:
        bg[key] = default
        print(f"added {key}")

p.write_text(json.dumps(j, ensure_ascii=False, indent=2), encoding='utf-8')
print("done lights material")
