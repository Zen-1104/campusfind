import requests

url = 'http://localhost:8080/api/items/found'
files = {'photo': open(r'C:\Users\shahi\.gemini\antigravity\brain\f81cba9e-c4d8-4365-87e3-e71374e5e010\demo_image_1776062249248.png', 'rb')}
data = {
    'title': 'Demo Image Wallet Test',
    'description': 'A test wallet',
    'location': 'Near the park',
    'category': 'Wallet / Purse'
}

response = requests.post(url, data=data, files=files)
print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.text}")
