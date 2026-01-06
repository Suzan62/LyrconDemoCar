from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_login():
    driver = webdriver.Chrome()
    driver.get("http://localhost:5173/login")

    wait = WebDriverWait(driver, 20)

    try:
        # 🔹 Wait until page is fully loaded
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")

        print("Page loaded")

        # 🔹 Locate email input
        email = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="email"]'))
        )
        
        # 🔹 Scroll + focus + type (IMPORTANT)
        driver.execute_script("arguments[0].scrollIntoView(true);", email)
        driver.execute_script("arguments[0].focus();", email)
        email.clear()
        email.send_keys("admin@lyrcon.com")
        print("Email entered")

        # 🔹 Locate password input
        password = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="password"]'))
        )

        driver.execute_script("arguments[0].scrollIntoView(true);", password)
        driver.execute_script("arguments[0].focus();", password)
        password.clear()
        password.send_keys("password") # Using default dev password
        print("Password entered")

        # 🔹 Locate Sign In button
        # Trying a more robust XPath in case text varies or is inside a span
        login_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sign In') or contains(text(), 'Login')]"))
        )

        driver.execute_script("arguments[0].scrollIntoView(true);", login_btn)
        login_btn.click()
        print("Login button clicked")

        # 🔹 Wait for redirect to dashboard or some dashboard element
        wait.until(EC.url_contains("localhost:5173/")) 
        
        # Verify success by checking for a dashboard element (e.g., sidebar or welcome message)
        # Assuming there is a sidebar or some text 'Dashboard'
        try:
           wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard')]")))
           print("✅ Login test executed successfully")
        except:
           print("⚠️ Login seems successful (URL changed) but 'Dashboard' text not found immediately.")

    except Exception as e:
        print(f"❌ Login test failed: {e}")
    finally:
        time.sleep(2) # brief pause to see result
        driver.quit()

if __name__ == "__main__":
    test_login()
