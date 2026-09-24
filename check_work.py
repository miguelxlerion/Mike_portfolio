import urllib.request, json
with urllib.request.urlopen('http://localhost:5173/data/portfolio.json') as r:
    d = json.load(r)
w = d['threeDPage']['work']['projects']
for p in w:
    print(f'{p["num"]}: cover={p.get("cover")}, image={p.get("image")}, visual={p.get("visual")}')