from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def login_to_app(driver, email="admin@lyrcon.com", password="password"):
    """
    Helper function to log in to the application.
    """
    driver.get("http://localhost:5173/login")

    wait = WebDriverWait(driver, 10)

    # Convert to ASCII symbols for cross-platform safety
    try:
        # Wait for page load
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")

        # Email
        email_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="email"]')))
        driver.execute_script("arguments[0].scrollIntoView(true);", email_field)
        email_field.clear()
        email_field.send_keys(email)

        # Password
        pass_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="password"]')))
        driver.execute_script("arguments[0].scrollIntoView(true);", pass_field)
        pass_field.clear()
        pass_field.send_keys(password)

        # Submit
        login_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sign In') or contains(text(), 'Login')]")))
        driver.execute_script("arguments[0].scrollIntoView(true);", login_btn)
        login_btn.click()

        # Wait for Dashboard redirect
        wait.until(EC.url_contains("localhost:5173/"))
        print("[PASS] Logged in successfully")

    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        raise e
