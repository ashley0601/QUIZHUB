import ast
from pathlib import Path
root = Path('.')
imports = set()
for path in root.rglob('*.py'):
    if 'venv' in path.parts:
        continue
    try:
        tree = ast.parse(path.read_text(encoding='utf-8'))
    except Exception:
        continue
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for name in node.names:
                imports.add(name.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.add(node.module.split('.')[0])
print('\n'.join(sorted(imports)))