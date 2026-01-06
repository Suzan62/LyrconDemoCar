import unittest
from selenium import webdriver
from pages.login_page import LoginPage
from pages.profile_page import ProfilePage
import time
import random

class TestAdvancedProfile(unittest.TestCase):
    
    def setUp(self):
        options = webdriver.ChromeOptions()
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        self.driver = webdriver.Chrome(options=options)
        
        # Login
        login = LoginPage(self.driver)
        login.load()
        login.login("admin@lyrcon.com", "password")
        
        self.profile = ProfilePage(self.driver)

    def tearDown(self):
        self.driver.quit()

    def test_profile_crud_operations(self):
        print("\n[INFO] Running Profile CRUD Test (Edit Details)...")
        self.profile.load()
        
        # Determine new location
        new_loc = f"Test City {random.randint(100, 999)}"
        self.profile.edit_location(new_loc)
        print(f"   Updated location to: {new_loc}")
        
        # Verify Persistence (reload page)
        self.driver.refresh()
        self.profile.wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        
        # Check existence
        is_visible = self.profile.is_location_visible(new_loc)
        self.assertTrue(is_visible, f"[FAIL] Persistence Fail: Location '{new_loc}' not found after reload")
        print("[PASS] CRUD: Profile update persisted successfully")

    def test_delete_account_gap_error(self):
        print("\n[INFO] Running Delete Account Gap Analysis...")
        self.profile.load()
        
        self.profile.initiate_delete()
        self.assertTrue(self.profile.is_delete_modal_open(), "[FAIL] Modal failed to open on Delete click")
        
        print("   Modal opened, clicking Cancel...")
        self.profile.cancel_delete()
        
        # Wait a bit for animation
        time.sleep(0.5)
        self.assertFalse(self.profile.is_delete_modal_open(), "[FAIL] Modal did not close on Cancel")
        
        # Verify account still exists (we are still logged in and on profile)
        # If deleted, we might be redirected. Check URL.
        self.assertIn("profile", self.driver.current_url, "[FAIL] Critical Gap: Redirected (possibly deleted) after Cancel!")
        
        print("[PASS] Gap Check: Delete Cancelled successfully, account safe")

if __name__ == "__main__":
    unittest.main()
