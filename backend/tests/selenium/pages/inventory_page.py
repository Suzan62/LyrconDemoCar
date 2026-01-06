from .base_page import BasePage
from selenium.webdriver.common.by import By

class InventoryPage(BasePage):
    URL = "http://localhost:5173/inventory"
    
    # Locators
    SEARCH_INPUT = (By.CSS_SELECTOR, 'input[placeholder*="Search"]')
    ADD_NEW_CAR_BTN = (By.XPATH, "//button[contains(., 'Add New Car')]")
    
    # Dynamic locator helpers
    def get_buy_button_locator(self, vin):
        # Assuming the Buy/Purchase button is related to the card containing the VIN
        # This might need adjustment based on exact DOM structure
        # Strategy: Find row/card with VIN, then find button inside it.
        # Simplified: Button having generic "Buy" text in the same container
        return (By.XPATH, f"//*[contains(text(), '{vin}')]/ancestor::div[contains(@class, 'card')]//button[contains(., 'Buy') or contains(., 'Purchase')]")

    def load(self):
        self.open_url(self.URL)

    def search_vehicle(self, query):
        self.enter_text(self.SEARCH_INPUT, query)
        # Wait for potential filter update (React often is fast but sometimes needs a moment)
        
    def click_add_new_car(self):
        self.click_element(self.ADD_NEW_CAR_BTN)

    def click_buy_button(self, vin):
        # In a real grid, we might need to search first to ensure specific car is visible
        self.search_vehicle(vin)
        # Try finding the specific buy button
        # If the button doesn't strictly have "Buy", check for specific icon or class
        # For now, we assume there's a button.
        btn_locator = self.get_buy_button_locator(vin)
        self.click_element(btn_locator)
