# This script checks and fixes common issues with AI configuration
import os
import sys
import requests

def check_api_key():
    """Check if the Google API key is configured correctly"""
    from dotenv import load_dotenv
    
    # Try to load from environment
    api_key = os.environ.get('GOOGLE_API_KEY')
    
    if not api_key:
        print("API key not found in environment variables, checking .env file...")
        
        # Try different paths
        paths = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api_keys', '.env'),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'api_keys', '.env')
        ]
        
        for env_path in paths:
            if os.path.exists(env_path):
                print(f"Loading .env from: {env_path}")
                load_dotenv(dotenv_path=env_path)
                api_key = os.environ.get('GOOGLE_API_KEY')
                if api_key:
                    print("API key loaded successfully.")
                    break
        
    if not api_key:
        print("\n⚠️ ERROR: Google API key is not configured!")
        print("Please make sure the GOOGLE_API_KEY environment variable is set or the .env file exists.")
        print("The API key should be in the format: AIza...")
        return False
    
    # Key is found, now check if it's valid
    print(f"Found API key: {api_key[:5]}...{api_key[-4:]}")
    
    try:
        # Try to make a simple request to validate the key
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        print("Testing connection to Google Gemini API...")
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hi, this is a test message to check if the API is working.")
        
        if response and hasattr(response, 'text'):
            print("✅ API key is valid and working correctly!")
            return True
        else:
            print("⚠️ API returned an unexpected response format.")
            return False
            
    except Exception as e:
        print(f"⚠️ Error testing API key: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Checking AI configuration...")
    if check_api_key():
        print("\n✅ All checks passed! The AI service should work correctly.")
        sys.exit(0)
    else:
        print("\n⚠️ Configuration issues detected. Please fix the issues above.")
        sys.exit(1)
