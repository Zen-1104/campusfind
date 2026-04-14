import google.generativeai as genai
genai.configure(api_key="AIzaSyB0gopOQoBlcI18hj8sAd-fCtMeqx8M7MA")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
