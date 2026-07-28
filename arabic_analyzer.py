import os
from dotenv import load_dotenv
from openai import OpenAI
from faster_whisper import WhisperModel

# Unicode RTL markers
RTL_START = '\u202B'  # Right-to-Left Embedding
RTL_END = '\u202C'    # Pop Directional Formatting
RTL_MARK = '\u200F'   # Right-to-Left Mark

# Load API key
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

# Initialize OpenAI client for analysis
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key
)

# Initialize Whisper for Arabic transcription
print("Loading Arabic transcription model...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

def format_arabic_text(text):
    """Format text for proper RTL display"""
    return f"{RTL_START}{text}{RTL_END}"

def transcribe_arabic_audio(audio_file_path):
    """Transcribe Arabic audio to text"""
    audio_file_path = os.path.abspath(audio_file_path)
    
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    print(f"🎤 Transcribing: {audio_file_path}...")
    
    try:
        segments, info = whisper_model.transcribe(
            audio_file_path,
            language="ar",
            beam_size=5,
            vad_filter=True
        )
        
        transcription = ""
        for segment in segments:
            arabic_text = segment.text.strip()
            # Add RTL formatting and timestamps
            # Ensure timestamps are LTR, then Arabic text is RTL
            formatted_line = f"\u200E[{segment.start:.2f}s - {segment.end:.2f}s]\u200F {RTL_START}{arabic_text}{RTL_END}"
            transcription += formatted_line + "\n"
        
        return transcription.strip()
    
    except Exception as e:
        raise Exception(f"Error transcribing audio: {e}")

def analyze_conversation(text):
    """Analyze conversation using free Qwen model"""
    print("🤖 Analyzing conversation...")
    
    try:
        response = client.chat.completions.create(
            model="qwen/qwen-2.5-7b-instruct:free",  # <--- USE THIS EXACT LINE (the :free suffix forces it to be free)
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert conversation analyst. Analyze the following Arabic conversation. Provide your analysis in English. Provide: 1) Brief Summary, 2) Key Issues, 3) Action Items, 4) Sentiment Analysis."
                },
                {
                    "role": "user", 
                    "content": text
                }
            ]
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        return f"Error in analysis: {e}"

def print_separator(char="=", width=70):
    """Print a formatted separator"""
    print(char * width)

# Main workflow
if __name__ == "__main__":
    print_separator()
    print("🎙️  ARABIC CONVERSATION ANALYZER")
    print_separator()
    
    # Get audio file path from user
    audio_file = input("\nEnter path to Arabic audio file (.wav, .mp3): ").strip()
    
    # If empty, look for files in current directory
    if not audio_file:
        files = [f for f in os.listdir('.') if f.endswith(('.wav', '.mp3'))]
        if files:
            print(f"\nFound audio files: {files}")
            audio_file = files[0]
            print(f"Using: {audio_file}")
        else:
            print("❌ No audio files found in current directory")
            exit()
    
    try:
        # Step 1: Transcribe
        transcription = transcribe_arabic_audio(audio_file)
        
        print("\n")
        print_separator("📋")
        print(" TRANSCRIPTION:")
        print_separator()
        # Print each line with RTL formatting
        for line in transcription.split('\n'):
            print(f"  {line}")
        
        # Step 2: Analyze
        analysis = analyze_conversation(transcription)
        
        print("\n")
        print_separator("📊")
        print(" ANALYSIS:")
        print_separator()
        print(analysis)
        
        # Step 3: Save results with proper UTF-8 and RTL support
        output_file = "analysis_result.txt"
        with open(output_file, "w", encoding="utf-8") as f:
            # Write a Unicode BOM for better compatibility with some text editors
            f.write('\ufeff')
            f.write(RTL_START)  # Start RTL for the whole document
            f.write(f"{RTL_START}TRANSCRIPTION:\n{RTL_END}")
            f.write(transcription)
            f.write("\n\n" + "="*60 + "\n")
            f.write(f"{RTL_START}ANALYSIS:\n{RTL_END}")
            f.write(analysis)
            f.write(RTL_END)  # End RTL for the whole document
            # Add a final LRM to ensure the file ends in LTR context if needed
            f.write('\u200E')
        
        print("\n" + "="*60)
        print(f"✅ Results saved to: {output_file}")
        print(f"💡 Open the file in a text editor that supports Arabic (like Notepad or VS Code)")
    
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("💡 Make sure the file exists and the path is correct")
    except PermissionError as e:
        print(f"\n❌ Error: {e}")
        print("💡 Try running Command Prompt as Administrator")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
