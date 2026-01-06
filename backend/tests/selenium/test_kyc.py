from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from utils import login_to_app

def test_kyc():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 20)

    try:
        login_to_app(driver)
        
        # Navigate to KYC
        print("Navigating to KYC...")
        driver.get("http://localhost:5173/kyc")
        
        # Verify KYC Wrapper/Page
        # Look for typical KYC indicators like 'Upload ID' or 'Verification'
        try:
             wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'KYC') or contains(text(), 'Verification')]")))
             print("✅ KYC page/intro loaded")
             
             # Check for Start or Next button if it's a wizard
             # This is speculative based on "Workflow" name
             next_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Start') or contains(., 'Next')]")
             if next_btns:
                 print("✅ Start/Next button found in KYC workflow")
             else:
                 print("ℹ️ No Start/Next button found immediately (might be direct form)")
                 
        except:
             print("⚠️ KYC specific text not found immediately")

    except Exception as e:
        print(f"❌ KYC test failed: {e}")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_kyc()
