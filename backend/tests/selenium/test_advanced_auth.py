import unittest
from selenium import webdriver
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

class TestAdvancedAuth(unittest.TestCase):
    
    def setUp(self):
        # Set up options to try capturing logs if supported by driver
        options = webdriver.ChromeOptions()
        # Logging prefs might differ by driver version/type
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        self.driver = webdriver.Chrome(options=options)
        self.login_page = LoginPage(self.driver)

    def tearDown(self):
        self.driver.quit()

    def test_positive_login(self):
        print("\n[INFO] Running Positive Login Test...")
        self.login_page.load()
        self.login_page.login("admin@lyrcon.com", "password")
        
        dashboard = DashboardPage(self.driver)
        # Assert redirected to dashboard
        self.assertTrue(dashboard.is_loaded(), "[FAIL] Failed to load Dashboard after valid login")
        print("[PASS] Positive Login: Success")
        
        # Check logs/crashes
        self.login_page.check_browser_logs()

    def test_negative_login_invalid_password(self):
        print("\n[INFO] Running Negative Login Test (Gap Analysis)...")
        self.login_page.load()
        self.login_page.login("admin@lyrcon.com", "wrongpassword", expect_success=False)
        
        # Gap Error Check: Should NOT crash, should show error
        is_error = self.login_page.is_error_displayed()
        self.assertTrue(is_error, "[FAIL] 'Invalid credentials' error not displayed for wrong password")
        
        # Verify we are NOT on dashboard
        dashboard = DashboardPage(self.driver)
        self.assertFalse(dashboard.is_loaded(), "[FAIL] Gap Error: Redirected to Dashboard with invalid credentials!")
        
        print("[PASS] Negative Login: Blocked correctly")
        self.login_page.check_browser_logs()

if __name__ == "__main__":
    unittest.main()
