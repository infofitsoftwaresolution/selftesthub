import requests
import concurrent.futures
import time
import random

# CONFIGURATION
BASE_URL = "https://selftesthub.com/api/v1"
TEST_EMAIL = "chinuakash64@gmail.com"  # Change to any valid whitelisted user you have
TEST_PASSWORD = "chinuakash"           # Change to the user's password
NUM_CONCURRENT_USERS = 100               # Number of simultaneous test takers
QUIZ_ID = 1                              # Update with an actual Quiz ID from your DB

def simulate_user(user_id):
    """Simulate a single user taking a quiz"""
    session = requests.Session()
    
    # 1. Login
    try:
        login_res = session.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code != 200:
            return f"User {user_id}: Failed to login ({login_res.status_code})"
        
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Fetch available quizzes
        quizzes_res = session.get(f"{BASE_URL}/dashboard/available-quizzes", headers=headers)
        if quizzes_res.status_code != 200:
            return f"User {user_id}: Failed to fetch quizzes"
        
        # 3. Start the Quiz
        start_res = session.post(f"{BASE_URL}/quizzes/{QUIZ_ID}/start", headers=headers)
        if start_res.status_code != 200:
            # Might be 400 if already attempted, but we just want to stress the server
            return f"User {user_id}: Failed to start quiz (might be already attempted): {start_res.json()}"
        
        attempt_id = start_res.json().get("attemptId")
        
        # Simulate time passing (40-50 mins is actual, but for a fast load test we wait a few seconds)
        # We add some jitter to randomize requests
        time.sleep(random.uniform(1.0, 3.0))
        
        # 4. Submit the Quiz
        # Submitting random dummy answers
        submit_res = session.post(
            f"{BASE_URL}/quizzes/{QUIZ_ID}/attempts/{attempt_id}/submit",
            headers=headers,
            json={"answers": {"1": 0, "2": 1, "3": 0}} # dummy format
        )
        
        if submit_res.status_code == 200:
            return f"User {user_id}: Successfully completed the quiz!"
        else:
            return f"User {user_id}: Failed to submit ({submit_res.status_code})"
            
    except Exception as e:
        return f"User {user_id}: Error - {str(e)}"

if __name__ == "__main__":
    print(f"🚀 Starting Load Test with {NUM_CONCURRENT_USERS} concurrent users...")
    start_time = time.time()
    
    # Use ThreadPoolExecutor to run 100 users concurrently
    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_CONCURRENT_USERS) as executor:
        # Start all user simulations
        futures = [executor.submit(simulate_user, i) for i in range(NUM_CONCURRENT_USERS)]
        
        # Wait for them to complete and print results
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            print(result)
            if "Successfully" in result:
                success_count += 1
                
    end_time = time.time()
    print("\n" + "="*50)
    print(f"📊 LOAD TEST COMPLETE")
    print(f"⏱️ Time taken: {end_time - start_time:.2f} seconds")
    print(f"✅ Success rate: {success_count}/{NUM_CONCURRENT_USERS} requests")
    print("="*50)
