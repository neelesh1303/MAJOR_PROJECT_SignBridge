import os
import json

# Directories
public_dir = os.path.join(os.getcwd(), "public")
letters_dir = os.path.join(public_dir, "letters")
gifs_dir = os.path.join(public_dir, "ISL_Gifs")
glossary_file = os.path.join(public_dir, "glossary.json")
isl_gifs_file = os.path.join(public_dir, "ISL_Gifs.json")


os.makedirs(public_dir, exist_ok=True)
os.makedirs(letters_dir, exist_ok=True)
os.makedirs(gifs_dir, exist_ok=True)

def normalize_key(name):
    """Remove extension, lowercase, replace underscores/hyphens with space, remove punctuation"""
    key = os.path.splitext(name)[0].lower().strip()
    key = key.replace("_", " ").replace("-", " ")
    key = ''.join(c for c in key if c.isalnum() or c.isspace())
    key = ' '.join(key.split())
    return key


def pretty_display(name):
    """Title-case version for display"""
    base = os.path.splitext(name)[0]
    words = base.replace("_", " ").replace("-", " ").split()
    return ' '.join(w.capitalize() for w in words)


# Mapping: normalized_key -> entry
entries_map = {}

# Process letters
if os.path.exists(letters_dir):
    for file in os.listdir(letters_dir):
        full_path = os.path.join(letters_dir, file)
        if not os.path.isfile(full_path):
            continue
        key = normalize_key(file)
        display_name = pretty_display(file)
        if key not in entries_map:
            entries_map[key] = {
                "word": display_name,
                "image": f"/letters/{file}",
                "gif": None,
                "searchKeys": [key]
            }
        else:
            entries_map[key]["image"] = f"/letters/{file}"
            if key not in entries_map[key]["searchKeys"]:
                entries_map[key]["searchKeys"].append(key)

# Process GIFs
if os.path.exists(gifs_dir):
    for file in os.listdir(gifs_dir):
        full_path = os.path.join(gifs_dir, file)
        if not os.path.isfile(full_path):
            continue
        key = normalize_key(file)
        display_name = pretty_display(file)
        if key not in entries_map:
            entries_map[key] = {
                "word": display_name,
                "image": None,
                "gif": f"/ISL_Gifs/{file}",
                "searchKeys": [key]
            }
        else:
            entries_map[key]["gif"] = f"/ISL_Gifs/{file}"
            if key not in entries_map[key]["searchKeys"]:
                entries_map[key]["searchKeys"].append(key)

# Convert to array
entries_list = []
for k, e in entries_map.items():
    extras = [e["word"].lower(), k.replace(" ", "")]
    search_keys = list(set((e.get("searchKeys") or []) + extras))
    entries_list.append({
        "word": e["word"],
        "image": e["image"],
        "gif": e["gif"],
        "searchKeys": search_keys,
        "examples": [f"Example for {e['word']}"]
    })

# Write JSON files
with open(isl_gifs_file, "w", encoding="utf-8") as f:
    json.dump(entries_list, f, indent=2, ensure_ascii=False)

with open(glossary_file, "w", encoding="utf-8") as f:
    json.dump(entries_list, f, indent=2, ensure_ascii=False)

print(f"✅ Written {len(entries_list)} entries to:")
print(" ", isl_gifs_file)
print(" ", glossary_file)
