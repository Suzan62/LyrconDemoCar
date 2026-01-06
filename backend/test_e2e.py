from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

driver = webdriver.Chrome()
driver.get("http://localhost:5173/login")

wait = WebDriverWait(driver, 20)

# 🔹 Wait until page is fully loaded
wait.until(lambda d: d.execute_script("return document.readyState") == "complete")

# 🔹 Locate email input
email = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[type="email"]'))
)

# 🔹 Scroll + focus + type (IMPORTANT)
driver.execute_script("arguments[0].scrollIntoView(true);", email)
driver.execute_script("arguments[0].focus();", email)
email.clear()
email.send_keys("admin@lyrcon.com")

# 🔹 Locate password input
password = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[type="password"]'))
)

driver.execute_script("arguments[0].scrollIntoView(true);", password)
driver.execute_script("arguments[0].focus();", password)
password.clear()
password.send_keys("password")

# 🔹 Locate Sign In button
login_btn = wait.until(
    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Sign In')]"))
)

driver.execute_script("arguments[0].scrollIntoView(true);", login_btn)
login_btn.click()

time.sleep(5)

print("✅ Login test executed")

driver.quit()
