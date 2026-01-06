from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from utils import login_to_app

def test_dashboard():
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 20)

    try:
        # 1. Login first
        login_to_app(driver)
        
        # 2. Verify Dashboard Elements
        print("Checking Dashboard elements...")
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard')]")))
        print("✅ Dashboard header found")

        # Check for correct stats
        try:
             driver.find_element(By.XPATH, "//*[contains(text(), 'Total Revenue')]")
             print("✅ 'Total Revenue' stat found")
        except:
             print("⚠️ 'Total Revenue' stat not found")

        # Verify Charts (Recharts uses SVG, not Canvas)
        try:
             # Look for Recharts class or SVG
             wait.until(EC.presence_of_element_located((By.CLASS_NAME, "recharts-surface")))
             print("✅ Chart (Recharts SVG) loaded")
        except:
             print("⚠️ No chart element found (looked for .recharts-surface)")

    except Exception as e:
        print(f"❌ Dashboard test failed: {e}")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_dashboard()
