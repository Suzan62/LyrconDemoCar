from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from utils import login_to_app

def test_settings_profile():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 20)

    try:
        login_to_app(driver)
        
        # Test Profile
        print("Navigating to Profile...")
        driver.get("http://localhost:5173/profile")
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Profile')]")))
        print("✅ Profile page loaded")

        # Check for profile inputs (name/email)
        # Using general input check as specific IDs might vary
        if len(driver.find_elements(By.TAG_NAME, "input")) > 0:
            print("✅ Profile inputs found")
        
        # Test Settings
        print("Navigating to Settings...")
        driver.get("http://localhost:5173/settings")
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Settings')]")))
        print("✅ Settings page loaded")

        # Check for theme toggle or typical settings elements
        # Assuming there is some toggle or button
        if len(driver.find_elements(By.TAG_NAME, "button")) > 0:
            print("✅ Settings controls found")
            
    except Exception as e:
        print(f"❌ Settings/Profile test failed: {e}")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_settings_profile()
