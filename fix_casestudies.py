import json

with open(r'X:\Proyectos\Personal_Web_Portfolio\data\portfolio.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Move caseStudies from work to threeDPage level
if 'work' in data['threeDPage'] and 'caseStudies' in data['threeDPage']['work']:
    data['threeDPage']['caseStudies'] = data['threeDPage']['work'].pop('caseStudies')
    print("Moved caseStudies to threeDPage level")
else:
    print("caseStudies not found in work")

with open(r'X:\Proyectos\Personal_Web_Portfolio\data\portfolio.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Done")