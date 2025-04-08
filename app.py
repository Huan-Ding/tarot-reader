from flask import Flask, render_template, request, jsonify, session
import random
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
from typing import List, Dict

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Configure OpenAI API
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url=os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1'),
    default_headers={"Content-Type": "application/json"}
)

# Tarot card data
TAROT_CARDS = {
    'major_arcana': [
        {'id': 0, 'name': 'The Fool', 'image': 'fool.jpg', 'meaning': 'New beginnings, innocence, spontaneity'},
        {'id': 1, 'name': 'The Magician', 'image': 'magician.jpg', 'meaning': 'Manifestation, resourcefulness, power'},
        {'id': 2, 'name': 'The High Priestess', 'image': 'high_priestess.jpg', 'meaning': 'Intuition, sacred knowledge, divine feminine'},
        {'id': 3, 'name': 'The Empress', 'image': 'empress.jpg', 'meaning': 'Fertility, nurturing, abundance'},
        {'id': 4, 'name': 'The Emperor', 'image': 'emperor.jpg', 'meaning': 'Authority, structure, control'},
        {'id': 5, 'name': 'The Hierophant', 'image': 'hierophant.jpg', 'meaning': 'Tradition, conformity, morality'},
        {'id': 6, 'name': 'The Lovers', 'image': 'lovers.jpg', 'meaning': 'Love, harmony, relationships'},
        {'id': 7, 'name': 'The Chariot', 'image': 'chariot.jpg', 'meaning': 'Determination, willpower, success'},
        {'id': 8, 'name': 'Strength', 'image': 'strength.jpg', 'meaning': 'Inner strength, courage, persuasion'},
        {'id': 9, 'name': 'The Hermit', 'image': 'hermit.jpg', 'meaning': 'Soul-searching, introspection, solitude'},
        {'id': 10, 'name': 'Wheel of Fortune', 'image': 'wheel_of_fortune.jpg', 'meaning': 'Change, cycles, fate'},
        {'id': 11, 'name': 'Justice', 'image': 'justice.jpg', 'meaning': 'Fairness, truth, cause and effect'},
        {'id': 12, 'name': 'The Hanged Man', 'image': 'hanged_man.jpg', 'meaning': 'Surrender, letting go, new perspective'},
        {'id': 13, 'name': 'Death', 'image': 'death.jpg', 'meaning': 'Endings, change, transformation'},
        {'id': 14, 'name': 'Temperance', 'image': 'temperance.jpg', 'meaning': 'Balance, moderation, patience'},
        {'id': 15, 'name': 'The Devil', 'image': 'devil.jpg', 'meaning': 'Bondage, materialism, temptation'},
        {'id': 16, 'name': 'The Tower', 'image': 'tower.jpg', 'meaning': 'Sudden change, upheaval, revelation'},
        {'id': 17, 'name': 'The Star', 'image': 'star.jpg', 'meaning': 'Hope, faith, purpose'},
        {'id': 18, 'name': 'The Moon', 'image': 'moon.jpg', 'meaning': 'Illusion, fear, anxiety'},
        {'id': 19, 'name': 'The Sun', 'image': 'sun.jpg', 'meaning': 'Joy, success, celebration'},
        {'id': 20, 'name': 'Judgement', 'image': 'judgement.jpg', 'meaning': 'Rebirth, inner calling, absolution'},
        {'id': 21, 'name': 'The World', 'image': 'world.jpg', 'meaning': 'Completion, integration, accomplishment'}
    ],
    'minor_arcana': [
        {'id': 22, 'name': 'Ace of Wands', 'image': 'ace_wands.jpg', 'meaning': 'New opportunities, inspiration, potential'},
        {'id': 23, 'name': 'Two of Wands', 'image': 'two_wands.jpg', 'meaning': 'Future planning, progress, decisions'},
        # ... Add more minor arcana cards as needed
    ]
}

def get_card_by_id(card_id: int) -> Dict:
    """Get card data by ID from either major or minor arcana."""
    for suit in TAROT_CARDS.values():
        for card in suit:
            if card['id'] == card_id:
                return card
    return None

def get_llm_recommendation(question: str) -> Dict:
    """Get card count recommendation from LLM based on the question."""
    print("\n=== Starting get_llm_recommendation ===")
    print(f"Question received: {question}")
    
    try:
        prompt = f"""As a tarot reader, recommend how many cards should be drawn for this question:
        Question: {question}
        
        Consider:
        1. The complexity of the question
        2. The type of guidance needed
        3. Traditional tarot spreads that might be appropriate
        
        You must respond with ONLY a valid JSON object in this exact format:
        {{
            "recommended_cards": <number between 1 and 5>,
            "explanation": "<brief explanation>"
        }}
        
        Keep the explanation short and concise. Do not include any other text or formatting."""
        
        print("Sending request to OpenAI API...")
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=300
            )
            print("API call successful!")
            print(f"Raw response: {response.choices[0].message.content}")
            
            # Clean the response to ensure it's valid JSON
            content = response.choices[0].message.content.strip()
            
            # Find the first '{' and last '}'
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            
            if start_idx == -1 or end_idx == -1:
                print("No valid JSON object found in response")
                return {"recommended_cards": 3, "explanation": "Default recommendation for a general reading"}
                
            content = content[start_idx:end_idx+1]
            print(f"Cleaned JSON content: {content}")
            
            # Try to parse the JSON
            try:
                result = json.loads(content)
                print(f"Parsed JSON result: {result}")
                # Validate the required fields
                if "recommended_cards" not in result or "explanation" not in result:
                    print("Missing required fields in JSON response")
                    return {"recommended_cards": 3, "explanation": "Default recommendation for a general reading"}
                # Ensure recommended_cards is within valid range
                result["recommended_cards"] = max(1, min(5, int(result["recommended_cards"])))
                print(f"Final result: {result}")
                return result
            except json.JSONDecodeError as json_error:
                print(f"JSON Decode Error: {str(json_error)}")
                print(f"Failed content: {content}")
                return {"recommended_cards": 3, "explanation": "Default recommendation for a general reading"}
                
        except Exception as api_error:
            print(f"API Error: {str(api_error)}")
            return {"recommended_cards": 3, "explanation": "API service error"}
            
    except Exception as e:
        print(f"Error in get_llm_recommendation: {str(e)}")
        print(f"Error type: {type(e)}")
        return {"recommended_cards": 3, "explanation": "Default recommendation due to service error"}
    finally:
        print("=== Ending get_llm_recommendation ===\n")

def get_reading_interpretation(question: str, card_ids: List[int]) -> str:
    """Get reading interpretation from LLM based on the question and drawn cards."""
    # Get card data for each selected card
    cards = []
    card_details = ""
    
    try:
        # First, get all card data
        for card_id in card_ids:
            if card_id < 22:  # Major Arcana
                card = TAROT_CARDS['major_arcana'][card_id]
            else:  # Minor Arcana
                minor_index = card_id - 22
                suit_index = minor_index // 14
                rank_index = minor_index % 14
                suits = ['wands', 'cups', 'swords', 'pentacles']
                ranks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King']
                
                card = {
                    'name': f"{ranks[rank_index]} of {suits[suit_index]}",
                    'meaning': f"Traditional meaning of {ranks[rank_index]} of {suits[suit_index]}"
                }
            cards.append(card)
        
        if not cards:
            return "I apologize, but I couldn't find the selected cards. Please try again."
        
        # Create a detailed prompt with card meanings
        card_details = "\n".join([
            f"- {card['name']}: {card.get('meaning', 'Traditional tarot meaning')}"
            for card in cards
        ])
        
        prompt = f"""As a tarot reader, provide a detailed reading for this question:
        Question: {question}
        
        Cards drawn and their meanings:
        {card_details}
        
        Provide a comprehensive reading that:
        1. Interprets each card in the context of the question
        2. Shows how the cards work together
        3. Offers specific guidance and recommendations
        4. Maintains a supportive and empowering tone
        
        Format your response in clear sections:
        1. Overall Reading
        2. Individual Card Interpretations
        3. How the Cards Work Together
        4. Guidance and Recommendations
        """
        
        # Try to get the interpretation from the API
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.9,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as api_error:
            print(f"API Error in get_reading_interpretation: {str(api_error)}")
            # If API fails, provide a basic interpretation
            return f"""I apologize, but I'm having trouble connecting to the advanced interpretation service. 
            Here's a basic interpretation of your cards:
            
            {card_details}
            
            Please try again in a moment for a more detailed reading."""
            
    except Exception as e:
        print(f"Error in get_reading_interpretation: {str(e)}")
        return "I apologize, but I'm having trouble interpreting the cards right now. Please try again."

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/api/recommend', methods=['POST'])
def recommend_cards():
    try:
        data = request.get_json()
        question = data.get('question', '')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        recommendation = get_llm_recommendation(question)
        return jsonify(recommendation)
    except Exception as e:
        print(f"Error in recommend_cards: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your request",
            "recommended_cards": 3,
            "explanation": "Default recommendation due to service error"
        }), 500

@app.route('/api/reading', methods=['POST'])
def get_reading():
    try:
        data = request.get_json()
        question = data.get('question', '')
        card_ids = data.get('cards', [])
        
        if not question or not card_ids:
            return jsonify({'error': 'Question and cards are required'}), 400
        
        interpretation = get_reading_interpretation(question, card_ids)
        
        return jsonify({
            'interpretation': interpretation,
            'cards': [get_card_by_id(card_id) for card_id in card_ids if get_card_by_id(card_id)]
        })
    except Exception as e:
        print(f"Error in get_reading: {str(e)}")
        return jsonify({
            'error': 'An error occurred while processing your request',
            'interpretation': 'I apologize, but I\'m having trouble interpreting the cards right now. Please try again.',
            'cards': []
        }), 500

@app.route('/api/follow-up', methods=['POST'])
def follow_up_reading():
    try:
        data = request.get_json()
        follow_up_question = data.get('question', '')
        previous_cards = data.get('previous_cards', [])
        
        if not follow_up_question or not previous_cards:
            return jsonify({'error': 'Follow-up question and previous cards are required'}), 400
        
        recommendation = get_llm_recommendation(follow_up_question)
        return jsonify(recommendation)
    except Exception as e:
        print(f"Error in follow_up_reading: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your request",
            "recommended_cards": 3,
            "explanation": "Default recommendation due to service error"
        }), 500

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/ask_followup', methods=['POST'])
def ask_followup():
    data = request.get_json()
    question = data.get('question')
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    try:
        # Get the reading from the session
        reading = session.get('reading')
        if not reading:
            return jsonify({'error': 'No previous reading found'}), 400
        
        # Create a prompt that includes the previous reading and the follow-up question
        prompt = f"""Previous reading: {reading}

Follow-up question: {question}

Please provide a tarot reading that addresses this follow-up question while considering the context of the previous reading. Focus on providing specific guidance and insights that build upon the previous reading."""
        
        # Get response from OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a wise and insightful tarot reader. Provide detailed, thoughtful readings that offer specific guidance and insights."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Extract the reading from the response
        reading = response.choices[0].message.content.strip()
        
        # Store the reading in the session
        session['reading'] = reading
        
        return jsonify({'reading': reading})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003) 