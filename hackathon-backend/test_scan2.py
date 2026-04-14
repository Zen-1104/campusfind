"""
Quick end-to-end test: download the BMW image and POST it to /api/scan_item
"""
import requests, sys

# Download the BMW test image
img_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Cat_poster_1.jpg/800px-Cat_poster_1.jpg"
try:
    img_data = requests.get(img_url, timeout=10).content
except Exception as e:
    print(f"Could not download test image: {e}")
    sys.exit(1)

# POST it to the scan endpoint
r = requests.post(
    "http://127.0.0.1:8080/api/scan_item",
    files={"photo": ("test.jpg", img_data, "image/jpeg")},
    timeout=30
)
print("Status :", r.status_code)
data = r.json()
print("Keywords:", data.get("keywords"))
print("Matches :", len(data.get("matches", [])), "item(s)")
for m in data.get("matches", []):
    print("  -", m.get("title"), "|", m.get("description"))
