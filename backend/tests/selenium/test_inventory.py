from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from utils import login_to_app

def test_inventory():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 20)

    try:
        login_to_app(driver)
        
        # Navigate to Inventory
        print("Navigating to Inventory...")
        driver.get("http://localhost:5173/inventory")
        
        # Verify Inventory Table
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        print("✅ Inventory table found")
        
        # Test Add Car Button
        # Button text is 'Add New Car'
        try:
            add_btn = driver.find_element(By.XPATH, "//button[contains(., 'Add New Car')]")
            add_btn.click()
            print("Clicked Add New Car button")
            
            # Check if we are on Add Car page
            wait.until(EC.url_contains("add-car"))
            print("✅ Navigated to Add Car page")
            
            # Form Validation / Input Check
            # Check for VIN input
            wait.until(EC.presence_of_element_located((By.NAME, "vin")))
            print("✅ Add Car form loaded (VIN input found)")
            
        except Exception as e:
            print(f"⚠️ Add Car flow check failed: {e}")

    except Exception as e:
        print(f"❌ Inventory test failed: {e}")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_inventory()
