import os
import time

from flask import Flask, render_template, request, jsonify
from google import genai
from dotenv import load_dotenv


# Load variables from .env
load_dotenv()


# Create Flask application
app = Flask(__name__)


# Get Gemini API key from .env
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY was not found. "
        "Please check your .env file."
    )


# Create Gemini client
client = genai.Client(api_key=api_key)


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Generate comic
@app.route("/generate", methods=["POST"])
def generate_comic():

    try:
        # Get JSON data from browser
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data was received."
            }), 400

        # Get user's story prompt
        user_prompt = data.get("prompt", "").strip()

        if not user_prompt:
            return jsonify({
                "error": "Please provide a story prompt."
            }), 400

        print("Generating comic for:", user_prompt)

        # Prompt for Gemini
        script_prompt = f"""
Create a complete 3-panel comic strip based on this story idea:

"{user_prompt}"

Create a simple, creative and connected story.

The comic must have:

Panel 1:
- Beginning of the story
- Scene description
- Character dialogue

Panel 2:
- Middle of the story
- Scene description
- Character dialogue

Panel 3:
- Ending of the story
- Scene description
- Character dialogue

Return ONLY valid JSON.

Use exactly this format:

[
    {{
        "panel": 1,
        "description": "Scene description",
        "dialogue": "Character dialogue"
    }},
    {{
        "panel": 2,
        "description": "Scene description",
        "dialogue": "Character dialogue"
    }},
    {{
        "panel": 3,
        "description": "Scene description",
        "dialogue": "Character dialogue"
    }}
]

Do not add markdown.
Do not add ```json.
Do not add any explanation outside the JSON.
"""

        # Send request to Gemini
        max_retries = 3

        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=script_prompt
                )
                break

            except Exception as e:
                if "503" in str(e) and attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(
                        f"Gemini is busy. Retrying in {wait_time} seconds..."
                    )
                    time.sleep(wait_time)
                else:
                    raise

        # Get AI response
        comic_script = response.text.strip()

        print("AI RESPONSE:")
        print(comic_script)

        return jsonify({
            "comic_script": comic_script
        })
        # Get AI response
        comic_script = response.text.strip()

        print("AI RESPONSE:")
        print(comic_script)

        # Send response back to browser
        return jsonify({
            "comic_script": comic_script
        })

    except Exception as e:

        print("ERROR:", repr(e))

        return jsonify({
            "error": str(e)
        }), 500


# Start Flask server
if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )