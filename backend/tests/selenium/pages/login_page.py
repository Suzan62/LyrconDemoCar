from .base_page import BasePage
from selenium.webdriver.common.by import By

class LoginPage(BasePage):
    URL = "http://localhost:5173/login"
    EMAIL_INPUT = (By.CSS_SELECTOR, 'input[type="email"]')
    PASSWORD_INPUT = (By.CSS_SELECTOR, 'input[type="password"]')
    SUBMIT_BTN = (By.XPATH, "//button[contains(., 'Sign In') or contains(text(), 'Login')]")
    # Generic error message locator - adjust based on actual app behavior
    ERROR_MESSAGE = (By.XPATH, "//*[contains(text(), 'Invalid credentials') or contains(text(), 'failed') or contains(text(), 'Invalid email or password')]")

    def load(self):
        self.open_url(self.URL)

    def login(self, email, password, expect_success=True):
        self.enter_text(self.EMAIL_INPUT, email)
        self.enter_text(self.PASSWORD_INPUT, password)
        self.click_element(self.SUBMIT_BTN)

        if expect_success:
            # Wait for redirect to ensure login success before proceeding
            from selenium.webdriver.support import expected_conditions as EC
            
            # URL check is flaky if "localhost:5173/" matches "localhost:5173/login"
            # Wait for Dashboard element or text
            self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard')]")))
            
            # Also wait for URL to not contain login just in case
            self.wait.until(lambda d: "/login" not in d.current_url)

    def is_error_displayed(self):
        try:
            # We use a short wait here since we expect it to appear quickly or not at all depending on test
            self.find_element(self.ERROR_MESSAGE)
            return True
        except:
            return False
