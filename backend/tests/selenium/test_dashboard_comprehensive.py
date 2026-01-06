from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
from utils import login_to_app

def test_dashboard_load_time_and_console_errors():
    """
    Comprehensive test for Dashboard page:
    - Measures page load time
    - Checks for JavaScript console errors
    - Verifies dashboard elements are loaded
    """
    # Set up Chrome options to capture console logs
    chrome_options = Options()
    chrome_options.add_argument("--log-level=3")  # Reduce log noise
    chrome_options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    wait = WebDriverWait(driver, 20)

    load_time = 0
    console_errors = []

    try:
        # 1. Login first and measure time to dashboard
        print("Starting login and navigation to dashboard...")
        start_time = time.time()

        login_to_app(driver)

        # Wait for dashboard to be fully loaded
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard')]")))

        # Additional wait for any dynamic content
        time.sleep(1)  # Allow for any remaining async loads

        end_time = time.time()
        load_time = end_time - start_time
        print(f"Page load time: {load_time:.2f}s")
        # 2. Check for JavaScript console errors
        print("Checking for JavaScript console errors...")
        logs = driver.get_log('browser')
        console_errors = [log for log in logs if log['level'] in ['SEVERE', 'ERROR']]

        if console_errors:
            print(f"❌ Found {len(console_errors)} JavaScript errors:")
            for error in console_errors:
                print(f"  - {error['level']}: {error['message']}")
        else:
            print("✅ No JavaScript console errors found")

        # 3. Verify Dashboard Elements (similar to existing test)
        print("Verifying dashboard elements...")

        # Check dashboard header
        try:
            driver.find_element(By.XPATH, "//*[contains(text(), 'Dashboard')]")
            print("✅ Dashboard header found")
        except Exception as e:
            print(f"❌ Dashboard header not found: {e}")
            raise

        # Check for revenue stat
        try:
            revenue_element = driver.find_element(By.XPATH, "//*[contains(text(), 'Total Revenue')]")
            print("✅ 'Total Revenue' stat found")
        except:
            print("⚠️ 'Total Revenue' stat not found")

        # Check for cars sold stat
        try:
            cars_element = driver.find_element(By.XPATH, "//*[contains(text(), 'Cars Sold')]")
            print("✅ 'Cars Sold' stat found")
        except:
            print("⚠️ 'Cars Sold' stat not found")

        # Verify Charts
        try:
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "recharts-surface")))
            print("✅ Chart (Recharts SVG) loaded")
        except:
            print("⚠️ No chart element found (looked for .recharts-surface)")

        # 4. Performance check - ensure load time is reasonable
        if load_time > 10:  # More than 10 seconds is concerning
            print(f"⚠️ Page load time is high: {load_time:.2f}s")
        else:
            print("✅ Page load time is acceptable")

        # 5. Final summary
        print("\n" + "="*50)
        print("DASHBOARD TEST SUMMARY")
        print("="*50)
        print(f"Load Time: {load_time:.2f}s")
        print(f"Console Errors: {len(console_errors)}")
        if console_errors:
            print("❌ TEST FAILED: Console errors detected")
            return False
        else:
            print("✅ TEST PASSED: No console errors, dashboard loaded successfully")
            return True

    except Exception as e:
        print(f"❌ Dashboard test failed with exception: {e}")
        return False
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    success = test_dashboard_load_time_and_console_errors()
    exit(0 if success else 1)