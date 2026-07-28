from dotenv import load_dotenv
import os

load_dotenv()  # Load variables from .env file

api_key = os.getenv("OPENROUTER_API_KEY")
print("API Key loaded:", api_key)

if api_key:
    print("✅ SUCCESS! Your .env file is working!")
else:
    print("❌ FAILED! Check your .env file")
