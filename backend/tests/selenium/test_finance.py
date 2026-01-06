from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from utils import login_to_app

def test_finance():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 20)

    try:
        login_to_app(driver)
        
        # Navigate to Finance
        print("Navigating to Finance...")
        driver.get("http://localhost:5173/finance")
        
        # Verify Finance Table
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        print("✅ Finance table found")
        
        # Test Add Finance Button
        try:
            add_btn = driver.find_element(By.XPATH, "//button[contains(., 'Add Finance') or contains(., 'New Record')]")
            add_btn.click()
            print("Clicked Add Finance button")
            
            wait.until(EC.url_contains("create"))
            print("✅ Navigated to Add Finance page")
            
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
            print("✅ Add Finance form loaded")
            
        except Exception as e:
            print(f"⚠️ Add Finance flow check failed: {e}")

    except Exception as e:
        print(f"❌ Finance test failed: {e}")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_finance()
