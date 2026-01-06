from .base_page import BasePage
from selenium.webdriver.common.by import By

class NotificationsPage(BasePage):
    URL = "http://localhost:5173/notifications"
    MARK_ALL_READ_BTN = (By.XPATH, "//button[contains(., 'Mark all read')]")
    # Validating based on background color or class changes requires care
    # We can check if "blue-50" (unread class) count decreases
    UNREAD_ITEMS = (By.CSS_SELECTOR, ".bg-blue-50\\/50") # Class for unread items

    def load(self):
        self.open_url(self.URL)

    def mark_all_read(self):
        self.click_element(self.MARK_ALL_READ_BTN)

    def get_unread_count(self):
        # We need to find elements immediately or with short wait
        try:
             # Use find_elements (plural) to count
             # Since BasePage uses presence_of_element_located for helpers, we use driver directly here for counting
             # but waiting for at least one might be good if we expect some
             # However, if 0 is valid, we shouldn't wait for presence.
             # Let's just return length of elements found
             return len(self.driver.find_elements(*self.UNREAD_ITEMS))
        except:
             return 0
