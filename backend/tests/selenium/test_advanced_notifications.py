import unittest
from selenium import webdriver
from pages.login_page import LoginPage
from pages.notifications_page import NotificationsPage

class TestAdvancedNotifications(unittest.TestCase):
    
    def setUp(self):
        options = webdriver.ChromeOptions()
        self.driver = webdriver.Chrome(options=options)
        
        login = LoginPage(self.driver)
        login.load()
        login.login("admin@lyrcon.com", "password")
        
        self.notif = NotificationsPage(self.driver)

    def tearDown(self):
        self.driver.quit()

    def test_notification_workflow(self):
        print("\n[INFO] Running Notification Workflow Test...")
        self.notif.load()
        
        time.sleep(1) # Allow load
        
        initial_unread = self.notif.get_unread_count()
        print(f"   Initial unread: {initial_unread}")
        
        # Only test mark read if there are unread items, or just click button anyway to ensure no crash
        if initial_unread > 0:
            self.notif.mark_all_read()
            # Wait for state update (React render)
            time.sleep(1)
            new_unread = self.notif.get_unread_count()
            self.assertEqual(new_unread, 0, "[FAIL] Mark All Read failed: Unread items still exist")
            print("[PASS] Notifications: Mark All Read success")
        else:
            print("[WARN] No unread notifications to test transition, but verifying button click...")
            self.notif.mark_all_read()
            # Ensure no crash
            print("[PASS] Button clicked without error")

if __name__ == "__main__":
    import time
    unittest.main()
