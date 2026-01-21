import requests
import json

BASE_URL = 'http://localhost:8000/api/auth'

# Use a test user credentials (you might need to create one or use existing)
# We can use the one the user likely just created.
EMAIL = "test@example.com" 
PASSWORD = "password123"

# Ideally we should register a new user to be sure, or use one we know exists.
# Let's try to register a dynamic one to ensure it exists
import random
import string

def random_string(length=10):
    return ''.join(random.choice(string.ascii_letters) for i in range(length))

rand_suffix = random_string(4)
TEST_EMAIL = f"debug_{rand_suffix}@example.com"
TEST_PASS = "ComplexPass123!"

def debug_auth():
    print(f"--- 1. Attempting Registration for {TEST_EMAIL} ---")
    reg_payload = {
        "username": f"debug_{rand_suffix}",
        "email": TEST_EMAIL,
        "password1": TEST_PASS,
        "password2": TEST_PASS
    }
    
    try:
        reg_response = requests.post(f"{BASE_URL}/registration/", json=reg_payload)
        print(f"Registration Status: {reg_response.status_code}")
        print(f"Registration Response: {reg_response.text}")
    except Exception as e:
        print(f"Registration failed to connect: {e}")
        return

    print(f"\n--- 2. Attempting Login ---")
    login_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASS
    }
    
    token = None
    try:
        login_response = requests.post(f"{BASE_URL}/login/", json=login_payload)
        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response Keys: {login_response.json().keys() if login_response.status_code == 200 else 'Error'}")
        print(f"Login Response Body: {login_response.text}")

        if login_response.status_code == 200:
            data = login_response.json()
            with open('login_response.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print("Saved response to login_response.json")
            
            # Check for common token keys
            if 'access_token' in data:
                token = data['access_token']
                print("Found 'access_token'")
            elif 'access' in data:
                token = data['access']
                print("Found 'access'")
            elif 'key' in data:
                token = data['key']
                print("Found 'key'")
            else:
                print("NO TOKEN FOUND IN RESPONSE")
    except Exception as e:
        print(f"Login failed to connect: {e}")
        return

    if token:
        print(f"\n--- 3. Attempting User Profile Fetch with Token ---")
        headers = {
            "Authorization": f"Bearer {token}"
        }
        print(f"Using Header: Authorization: Bearer {token[:10]}...")
        
        try:
            profile_response = requests.get(f"{BASE_URL}/user/", headers=headers)
            print(f"Profile Status: {profile_response.status_code}")
            print(f"Profile Response: {profile_response.text}")
        except Exception as e:
            print(f"Profile fetch failed: {e}")
    else:
        print("Skipping step 3 as no token was retrieved.")

if __name__ == "__main__":
    debug_auth()
