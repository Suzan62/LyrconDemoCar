from .base_page import BasePage
from selenium.webdriver.common.by import By

class PurchasePage(BasePage):
    # This URL might be dynamic (e.g., /purchase/:id), so load might take an ID
    URL_TEMPLATE = "http://localhost:5173/purchase/{}" 
    
    # Locators (Hypothetical - adjust based on PurchaseCar.jsx)
    CUSTOMER_NAME_INPUT = (By.NAME, "customerName")
    EMAIL_INPUT = (By.NAME, "email")
    PHONE_INPUT = (By.NAME, "phone")
    CONFIRM_PURCHASE_BTN = (By.XPATH, "//button[contains(., 'Confirm Purchase') or contains(., 'Place Order')]")
    SUCCESS_MESSAGE = (By.XPATH, "//*[contains(text(), 'Purchase Successful') or contains(text(), 'Order Confirmed')]")

    def load_for_vehicle(self, vehicle_id):
        self.open_url(self.URL_TEMPLATE.format(vehicle_id))

    def fill_purchase_form(self, name, email, phone):
        self.enter_text(self.CUSTOMER_NAME_INPUT, name)
        self.enter_text(self.EMAIL_INPUT, email)
        self.enter_text(self.PHONE_INPUT, phone)

    def submit_purchase(self):
        self.click_element(self.CONFIRM_PURCHASE_BTN)

    def is_purchase_successful(self):
        try:
            self.find_element(self.SUCCESS_MESSAGE)
            return True
        except:
            return False
