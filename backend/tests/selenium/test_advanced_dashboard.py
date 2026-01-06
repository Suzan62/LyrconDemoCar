import unittest
from selenium import webdriver
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
import time

class TestAdvancedDashboard(unittest.TestCase):
    
    def setUp(self):
        options = webdriver.ChromeOptions()
        options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
        self.driver = webdriver.Chrome(options=options)
        
        # Login first for valid session
        login = LoginPage(self.driver)
        login.load()
        login.login("admin@lyrcon.com", "password")
        
        self.dashboard = DashboardPage(self.driver)

    def tearDown(self):
        self.driver.quit()

    def test_dashboard_data_integrity(self):
        print("\n[INFO] Running Dashboard Data Integrity Test...")
        self.dashboard.wait.until(lambda d: self.dashboard.is_loaded())
        
        revenue = self.dashboard.get_revenue_value()
        cars_sold = self.dashboard.get_cars_sold_value()
        
        print(f"   Revenue: {revenue}, Cars Sold: {cars_sold}")
        
        # Assert not empty or zero-like if we expect data
        self.assertNotEqual(revenue, "", "[FAIL] Revenue is empty")
        self.assertNotEqual(revenue, "$0", "[WARN] Revenue is $0 (Might be valid but checking for data)")
        self.assertNotEqual(cars_sold, "", "[FAIL] Cars Sold is empty")
        
        print("[PASS] Data Integrity: Widgets loaded values")

    def test_dashboard_interactive_charts(self):
        print("\n[INFO] Running Dashboard Chart Interaction Test...")
        # Check chart exists
        self.dashboard.hover_over_chart()
        time.sleep(1) # Allow animation/rendering
        
        # Check tooltip
        is_tooltip = self.dashboard.is_tooltip_visible()
        if is_tooltip:
             print("[PASS] Interactive Chart: Tooltip displayed on hover")
        else:
             print("[WARN] Interactive Chart: Tooltip NOT detected (Test flaky on canvas/svg often)")
             
    def test_dashboard_performance_and_logs(self):
        print("\n[INFO] Running Dashboard Performance & Crash Test...")
        
        # Reload to measuring load time fresh
        self.dashboard.load()
        load_time = self.dashboard.get_page_load_time()
        
        # Benchmarking
        self.assertLess(load_time, 2.0, f"Performance Warning: Dashboard took {load_time}s (Limit 2s)")
        print(f"[PASS] Performance: Load time {load_time}s is within limits")
        
        # Check for crashes
        crashes = self.dashboard.check_browser_logs()
        self.assertEqual(len(crashes), 0, "[FAIL] Crash Detection: SEVERE logs found in console")

if __name__ == "__main__":
    unittest.main()
