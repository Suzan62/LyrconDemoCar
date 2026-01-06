from .base_page import BasePage
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
import time

class VehicleFormPage(BasePage):
    URL_ADD = "http://localhost:5173/add-car"
    URL_SELL = "http://localhost:5173/sell-old-car"
    
    # Common Locators
    DOCKET_INPUT = (By.NAME, "docket_number")
    VIN_INPUT = (By.NAME, "vin")
    MANUFACTURER_INPUT = (By.NAME, "manufacturer")
    MODEL_INPUT = (By.NAME, "model")
    YEAR_INPUT = (By.NAME, "year")
    SAVE_BTN = (By.XPATH, "//button[contains(., 'Save Transaction')]")
    
    # Sale Specific
    AUTOFILL_SELECT = (By.CSS_SELECTOR, "select") # The only select in top section for sale
    BUYER_NAME = (By.NAME, "buyer_name")
    BUYER_EMAIL = (By.NAME, "buyer_email")
    
    def load_add_car(self):
        self.open_url(self.URL_ADD)

    def load_sell_car(self):
        self.open_url(self.URL_SELL)

    def fill_new_vehicle_form(self, docket, vin, make, model, year):
        self.enter_text(self.DOCKET_INPUT, docket)
        self.enter_text(self.VIN_INPUT, vin)
        self.enter_text(self.MANUFACTURER_INPUT, make)
        self.enter_text(self.MODEL_INPUT, model)
        self.enter_text(self.YEAR_INPUT, year)
        
    def select_vehicle_to_sell(self, vehicle_text_partial):
        # Locate select, wait for options
        select_elem = self.find_element(self.AUTOFILL_SELECT)
        select = Select(select_elem)
        
        # We need to find the option that contains our unique VIN or ID
        # Since Select by visible text needs exact match, we might iterate options
        found = False
        for opt in select.options:
            if vehicle_text_partial in opt.text:
                select.select_by_visible_text(opt.text)
                found = True
                break
        
        if not found:
            raise Exception(f"Vehicle with text '{vehicle_text_partial}' not found in dropdown")

    def fill_sale_details(self, buyer_name, buyer_email):
        self.enter_text(self.BUYER_NAME, buyer_name)
        self.enter_text(self.BUYER_EMAIL, buyer_email)

    def submit(self):
        # The form is long, so we need to scroll to the button
        btn = self.find_element(self.SAVE_BTN)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", btn)
        # Small pause for scroll animation/obsctruction clearing
        time.sleep(0.5)
        # Using JS click often bypasses "intercepted" errors if it's just a footer overlay
        self.driver.execute_script("arguments[0].click();", btn)

    def go_to_inventory(self):
        # Click the "Back" arrow button in the AddCar header
        # Uses SVG class locator typical for Lucide icons
        try:
             back_btn = self.find_element((By.XPATH, "//button[.//svg[contains(@class, 'lucide-arrow-left')]]"))
             back_btn.click()
        except:
             # Fallback: Try Sidebar "Inventory" toggle then "All Inventory"
             try:
                 # Toggle
                 toggle = self.find_element((By.XPATH, "//button[contains(., 'Inventory')]"))
                 toggle.click()
                 time.sleep(0.5)
                 # Link
                 link = self.find_element((By.XPATH, "//a[@href='/inventory']"))
                 link.click()
             except:
                 print("[WARN] UI Navigation failed, forcing reload (May clear Redux state)")
                 self.open_url("http://localhost:5173/inventory")
