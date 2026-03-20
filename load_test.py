import requests
import concurrent.futures
import time
import random

BASE_URL = "https://selftesthub.com/api/v1"
TEST_EMAIL = "chinuakash64@gmail.com"
TEST_PASSWORD = "chinuakash"
NUM_CONCURRENT_USERS = 100
QUIZ_ID = 1

def simulate_user(user_id):
    # Simulate users arriving slightly randomly over 10 seconds, instead of all at the exact same microsecond
    time.sleep(random.uniform(0, 10.0))
    
    session = requests.Session()
    try:
        login_res = session.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code != 200:
            return f"User {user_id}: Login Failed ({login_res.status_code}) - {login_res.text}"
        
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        quizzes_res = session.get(f"{BASE_URL}/dashboard/available-quizzes", headers=headers)
        if quizzes_res.status_code != 200:
            return f"User {user_id}: Fetch Quizzes Failed ({quizzes_res.status_code}) - {quizzes_res.text}"
        
        start_res = session.post(f"{BASE_URL}/quizzes/{QUIZ_ID}/start", headers=headers)
        if start_res.status_code != 200:
            return f"User {user_id}: Failed to start quiz (Expected, but ok!) - {start_res.text}"
        
        attempt_id = start_res.json().get("attemptId")
        time.sleep(random.uniform(1.0, 3.0))
        
        submit_res = session.post(
            f"{BASE_URL}/quizzes/{QUIZ_ID}/attempts/{attempt_id}/submit",
            headers=headers,
            json={"answers": {"1": 0}}
        )
        
        if submit_res.status_code == 200:
            return f"User {user_id}: ✅ Successfully completed the quiz!"
        else:
            return f"User {user_id}: Submit Failed ({submit_res.status_code}) - {submit_res.text}"
            
    except Exception as e:
        return f"User {user_id}: Error - {str(e)}"

if __name__ == "__main__":
    print(f"🚀 Starting REALISTIC Load Test with {NUM_CONCURRENT_USERS} users spaced over 10 seconds...")
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_CONCURRENT_USERS) as executor:
        futures = [executor.submit(simulate_user, i) for i in range(NUM_CONCURRENT_USERS)]
        for future in concurrent.futures.as_completed(futures):
            print(future.result())
            
    end_time = time.time()
    print("\n" + "="*50)
    print(f"📊 LOAD TEST COMPLETE in {end_time - start_time:.2f} seconds")
    print("="*50)
