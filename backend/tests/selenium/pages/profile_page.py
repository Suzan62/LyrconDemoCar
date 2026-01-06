from .base_page import BasePage
from selenium.webdriver.common.by import By
import time

class ProfilePage(BasePage):
    URL = "http://localhost:5173/profile"
    
    # Edit Flow
    EDIT_DETAILS_BTN = (By.XPATH, "//button[contains(., 'Edit Details')]")
    LOCATION_INPUT = (By.NAME, "location")
    SAVE_CHANGES_BTN = (By.XPATH, "//button[contains(., 'Save Changes')]")
    LOCATION_DISPLAY = (By.XPATH, "//div[contains(text(), 'Location')]/..") # Parent of label, or value next to it

    # Delete Flow
    DELETE_ACCOUNT_BTN = (By.XPATH, "//button[contains(., 'Delete Account')]")
    CONFIRM_DELETE_BTN = (By.XPATH, "//button[contains(., 'Yes, Delete Account')]")
    CANCEL_DELETE_BTN = (By.CSS_SELECTOR, "[data-testid='cancel-delete-btn']")
    
    # Modal
    DELETE_MODAL = (By.XPATH, "//*[contains(text(), 'Confirm Deletion') or contains(text(), 'Delete Account')]") # Title in modal

    def load(self):
        self.open_url(self.URL)

    def edit_location(self, new_location):
        self.click_element(self.EDIT_DETAILS_BTN)
        
        # Ensure data is loaded (email should not be empty) to prevent bad PUT
        self.wait.until(lambda d: d.find_element(By.NAME, "email").get_attribute("value") != "")
        
        self.enter_text(self.LOCATION_INPUT, new_location)
        self.click_element(self.SAVE_CHANGES_BTN)
        # Wait for "Edit Details" to reappear implies save done (mode switched back)
        self.wait.until(lambda d: len(d.find_elements(*self.EDIT_DETAILS_BTN)) > 0)
        time.sleep(1) # Wait for backend sync

    def get_location_value(self):
        # This is tricky as the DOM structure for display was: 
        # <div class="p-2 ..."><MapPin ... /> New York</div>
        # So we might check if the text contains the location or get specific text
        # Let's try to find the element containing the location value
        # Simplified: just return page source or check if text exists in page
        pass 

    def is_location_visible(self, location_text):
        try:
             self.find_element((By.XPATH, f"//*[contains(text(), '{location_text}')]"))
             return True
        except:
             return False

    def initiate_delete(self):
        self.click_element(self.DELETE_ACCOUNT_BTN)

    def cancel_delete(self):
        # Force JS Click to bypass overlay/intercept issues
        script = "document.querySelector(\"[data-testid='cancel-delete-btn']\").click();"
        self.driver.execute_script(script)
        
        # Wait for modal to disappear
        from selenium.webdriver.support import expected_conditions as EC
        self.wait.until(EC.invisibility_of_element_located(self.DELETE_MODAL))

    def is_delete_modal_open(self):
        try:
            # Check if modal title is visible
            element = self.find_element(self.DELETE_MODAL)
            return element.is_displayed()
        except:
            return False
