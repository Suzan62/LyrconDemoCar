from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from utils import login_to_app

def test_inquiries():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 20)

    try:
        login_to_app(driver)
        
        # Navigate to Inquiries
        print("Navigating to Inquiries...")
        driver.get("http://localhost:5173/inquiries")
        
        # Verify Inquiries Table
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        print("✅ Inquiries table found")
        
        # Test Add Inquiry Button
        try:
            add_btn = driver.find_element(By.XPATH, "//button[contains(., 'Add Inquiry')]")
            add_btn.click()
            print("Clicked Add Inquiry button")
            
            # Check if we are on Add Inquiry page or Modal
            # Assuming it navigates to a new page based on routes
            wait.until(EC.url_contains("create"))
            print("✅ Navigated to Add Inquiry page")
            
            # Check for form elements
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
            print("✅ Add Inquiry form loaded")
            
        except Exception as e:
            print(f"⚠️ Add Inquiry flow check failed: {e}")

    except Exception as e:
        print(f"❌ Inquiries test failed: {e}")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_inquiries()
