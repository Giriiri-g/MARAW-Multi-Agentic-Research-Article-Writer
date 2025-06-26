from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Sample agents for demonstration
AGENTS = [
    "Planner",
    "Content Generator", 
    "Citation Manager",
    "Critic",
    "Plagiarism Watchdog",
    "Code Formatter"
]

# Sample responses for different types of user messages
SAMPLE_RESPONSES = {
    "default": [
        {
            "agent": "Planner",
            "reasoning": "Analyzing the user's request to understand the context and determine the best approach for processing this information.",
            "message": "I've received your input and I'm processing it. Let me break down what you're asking for and create a structured approach."
        },
        {
            "agent": "Content Generator",
            "reasoning": "Based on the analysis, I need to generate relevant content that addresses the user's specific requirements while maintaining quality and coherence.",
            "message": "I'm generating content based on your request. The information will be structured and comprehensive to meet your needs."
        },
        {
            "agent": "Critic",
            "reasoning": "Evaluating the generated content for quality, accuracy, and completeness to ensure it meets the expected standards.",
            "message": "I've reviewed the generated content and it meets the quality standards. The information is accurate and well-structured."
        }
    ],
    "research": [
        {
            "agent": "Citation Manager",
            "reasoning": "The user's query relates to research, so I need to identify relevant academic sources and ensure proper citation formatting.",
            "message": "I'm searching academic databases for relevant sources. Found 15 papers related to your topic. Preparing citation list in standard format."
        },
        {
            "agent": "Content Generator",
            "reasoning": "With citations identified, I can now generate research-focused content that incorporates these sources appropriately.",
            "message": "Generating research content with proper academic structure. Including introduction, methodology discussion, and literature review sections."
        }
    ],
    "code": [
        {
            "agent": "Code Formatter",
            "reasoning": "The user's request involves code-related tasks, so I need to ensure proper formatting, syntax checking, and best practices.",
            "message": "I'm analyzing your code requirements. Applying proper formatting standards and checking for syntax compliance."
        },
        {
            "agent": "Critic",
            "reasoning": "Code review is essential to identify potential issues, optimize performance, and ensure maintainability.",
            "message": "Code review complete. The implementation follows best practices and is optimized for performance and readability."
        }
    ],
    "writing": [
        {
            "agent": "Content Generator",
            "reasoning": "The user needs writing assistance, so I'll focus on creating well-structured, engaging content that meets their specific requirements.",
            "message": "Creating written content based on your specifications. Ensuring proper tone, structure, and flow for maximum impact."
        },
        {
            "agent": "Plagiarism Watchdog",
            "reasoning": "For any writing task, originality check is crucial to ensure the content is unique and doesn't infringe on existing works.",
            "message": "Running originality analysis on the generated content. Plagiarism check shows 2% similarity - well within acceptable limits."
        }
    ]
}

def get_response_category(user_message):
    """Determine the category of user message to provide relevant responses"""
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ['research', 'paper', 'study', 'academic', 'citation']):
        return 'research'
    elif any(word in message_lower for word in ['code', 'programming', 'script', 'function', 'debug']):
        return 'code'
    elif any(word in message_lower for word in ['write', 'writing', 'essay', 'article', 'content']):
        return 'writing'
    else:
        return 'default'

def generate_response(user_message):
    """Generate a contextual response based on user input"""
    category = get_response_category(user_message)
    responses = SAMPLE_RESPONSES.get(category, SAMPLE_RESPONSES['default'])
    
    # Select a random response from the category
    selected_response = random.choice(responses)
    
    # Customize the response based on user input
    if len(user_message) > 50:
        selected_response['reasoning'] += f" The detailed nature of your request requires careful analysis to provide comprehensive assistance."
    
    return selected_response

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server is running"""
    return jsonify({
        "status": "healthy",
        "message": "Python server is running successfully",
        "timestamp": time.time()
    }), 200

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint that receives user messages and returns agent responses"""
    try:
        data = request.json
        
        if not data or 'message' not in data:
            return jsonify({
                "error": "Invalid request format",
                "expected": "JSON with 'message' field"
            }), 400
        
        user_message = data['message'].strip()
        
        if not user_message:
            return jsonify({
                "error": "Empty message",
                "message": "Please provide a non-empty message"
            }), 400
        
        print(f"📥 Received message: {user_message}")
        
        # Generate response based on user input
        response = generate_response(user_message)
        
        print(f"📤 Sending response from {response['agent']}")
        
        # Add some delay to simulate processing time
        time.sleep(0.5)
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error processing request: {str(e)}")
        return jsonify({
            "agent": "System",
            "reasoning": "An unexpected error occurred while processing your request.",
            "message": f"Error: {str(e)}"
        }), 500

@app.route('/agents', methods=['GET'])
def get_agents():
    """Get list of available agents"""
    return jsonify({
        "agents": AGENTS,
        "total": len(AGENTS)
    }), 200

@app.route('/', methods=['GET'])
def home():
    """Basic home endpoint"""
    return jsonify({
        "message": "Python Chat Server is running",
        "endpoints": {
            "/health": "GET - Health check",
            "/chat": "POST - Send chat message",
            "/agents": "GET - Get available agents"
        }
    }), 200

if __name__ == '__main__':
    print("🚀 Starting Python Chat Server...")
    print("📡 Server will run on http://localhost:5000")
    print("💬 Chat endpoint: POST /chat")
    print("🔍 Health check: GET /health")
    print("👥 Agents list: GET /agents")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )