import subprocess
import os
import sys
import time

def run_test(script_name):
    """Runs a single test script and returns success status."""
    print(f"\n[INFO] Running {script_name}...")
    try:
        # Using sys.executable to ensure we use the same python interpreter
        result = subprocess.run([sys.executable, script_name], capture_output=True, text=True, encoding='utf-8', errors='replace')
        
        print(result.stdout)
        
        if result.returncode == 0:
            print(f"[PASS] {script_name} PASSED")
            return True
        else:
            print(f"[FAIL] {script_name} FAILED")
            # Only print stderr if there's actual error output to avoid clutter
            if result.stderr:
                print("Errors:")
                print(result.stderr)
            return False
    except Exception as e:
        print(f"[FAIL] Execution failed for {script_name}: {e}")
        return False

def main():
    # List of test scripts in order
    tests = [
        "test_auth.py",        # Basic Login
        "test_advanced_auth.py", # POM Auth (Positive & Negative)
        "test_dashboard.py",   # Basic Dashboard
        "test_advanced_dashboard.py", # POM Dashboard (Perf & Charts)
        "test_inventory.py",
        "test_inquiries.py",
        "test_finance.py",
        "test_settings_profile.py",
        "test_advanced_profile.py", # POM Profile (CRUD & Gap)
        "test_advanced_notifications.py", # POM Notifications
        "test_e2e_purchase_flow.py", # Full E2E Lifecycle
        "test_kyc.py"
    ]
    
    # Ensure we are in the directory where this script is, or handle paths
    # Assuming run from tests/selenium/ or root with python tests/selenium/run_all_tests.py
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    print(f"Folder: {script_dir}")

    passed = 0
    failed = 0

    print("--- Starting All Tests ---")
    start_time = time.time()

    for test in tests:
        if run_test(test):
            passed += 1
        else:
            failed += 1

    total_time = time.time() - start_time
    print("\n" + "="*40)
    print(f"[DONE] Test Suite Run Complete in {total_time:.2f}s")
    print(f"[PASS]: {passed}")
    print(f"[FAIL]: {failed}")
    print("="*40)

if __name__ == "__main__":
    main()
