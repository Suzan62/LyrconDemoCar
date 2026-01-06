import unittest
import time
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from pages.login_page import LoginPage

class InsurancePage(BasePage):
    INSURANCES_MENU = (By.XPATH, "//span[contains(text(), 'Insurances')]")
    ADD_INSURANCE_LINK = (By.XPATH, "//a[@href='/insurances/add']")
    
    # Form Fields
    BANK_NAME = (By.NAME, "bank_name")
    CUSTOMER_NAME = (By.NAME, "customer_name")
    CUSTOMER_PHONE = (By.NAME, "customer_phone")
    VEHICLE_SELECT = (By.NAME, "vehicle_id")
    SUBMIT_BTN = (By.XPATH, "//button[contains(text(), 'Create')]")
    
    # List Page
    INSURANCE_TABLE = (By.TAG_NAME, "table")

    def navigate_to_add(self):
        self.click_element(self.INSURANCES_MENU)
        self.click_element(self.ADD_INSURANCE_LINK)
    
    def fill_form(self, data):
        self.enter_text(self.BANK_NAME, data['bank_name'])
        self.enter_text(self.CUSTOMER_NAME, data['customer_name'])
        self.enter_text(self.CUSTOMER_PHONE, data['customer_phone'])
        # Select vehicle if present? skipping select for simplicity or need custom method
        
    def submit(self):
        self.click_element(self.SUBMIT_BTN)

class TestInsurance(unittest.TestCase):
    def setUp(self):
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        options = Options()
        # options.add_argument("--headless") # Optional
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        
        self.login_page = LoginPage(self.driver)
        self.insurance_page = InsurancePage(self.driver)
        
        self.login_page.load()
        self.login_page.login("admin@lyrcon.com", "admin123")

    def tearDown(self):
        if self.driver:
            self.driver.quit()

    def test_create_insurance(self):
        print("\n[INFO] Testing Insurance Creation...")
        self.insurance_page.navigate_to_add()
        time.sleep(1)
        
        data = {
            "bank_name": "Test Bank",
            "customer_name": "John Doe Insurance",
            "customer_phone": "9998887776"
        }
        self.insurance_page.fill_form(data)
        self.insurance_page.submit()
        
        # Verify functionality (e.g. redirect)
        time.sleep(2)
        current_url = self.driver.current_url
        self.assertIn("/insurances", current_url, "Did not redirect to list page")

if __name__ == '__main__':
    unittest.main()
