import os
from dotenv import load_dotenv
from openai import OpenAI

# Load the API key from your .env file
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

# Initialize the OpenAI client with OpenRouter's settings
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key
)

conversation_text = """
Customer: Hello, I need help resetting my password.
Agent: Sure, I can help with that. Please go to the login page and click 'Forgot Password'.
Customer: I did that, but I didn't receive the email.
Agent: Let me check your account. Please provide your email address.
"""

print("Analyzing conversation with FREE models... Please wait.\n")

try:
    response = client.chat.completions.create(
        # ✅ Use openrouter/free - automatically picks available free models
        # This avoids rate limits by routing between different free models
        model="openrouter/free",  # Auto-routes to ANY available free model
        
        messages=[
            {
                "role": "system", 
                "content": "You are an expert conversation analyst. Analyze and summarize the following conversation. Provide: 1) A brief summary, 2) Key issues, 3) Action items."
            },
            {
                "role": "user", 
                "content": conversation_text
            }
        ]
    )

    summary = response.choices[0].message.content
    print("✅ ANALYSIS COMPLETE:\n")
    print(summary)

except Exception as e:
    print(f"❌ Error occurred: {e}")
