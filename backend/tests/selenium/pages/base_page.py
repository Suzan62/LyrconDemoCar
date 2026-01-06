from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def open_url(self, url):
        self.driver.get(url)

    def find_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def click_element(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        try:
            element.click()
        except Exception:
            # Fallback for intercepted clicks (toasts, sticky footers)
            self.driver.execute_script("arguments[0].click();", element)

    def enter_text(self, locator, text):
        element = self.wait.until(EC.presence_of_element_located(locator))
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator):
        element = self.wait.until(EC.presence_of_element_located(locator))
        return element.text

    def check_browser_logs(self):
        """Captures SEVERE browser logs (JS crashes)."""
        try:
            logs = self.driver.get_log('browser')
            severe_logs = [entry for entry in logs if entry['level'] == 'SEVERE']
            if severe_logs:
                print(f"[FAIL] JS CRASH DETECTED: {severe_logs}")
            else:
                print("[PASS] No JS Crashes found in console.")
            return severe_logs
        except Exception as e:
            print(f"[WARN] Could not fetch browser logs (driver might not support it): {e}")
            return []

    def get_page_load_time(self):
        """Calculates page load time using Navigation Timing API."""
        try:
            # Ensure page is loaded enough to have timing
            self.wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
            
            navigation_start = self.driver.execute_script("return window.performance.timing.navigationStart")
            load_event_end = self.driver.execute_script("return window.performance.timing.loadEventEnd")
            
            # If loadEventEnd is 0, give it a moment
            if load_event_end == 0:
                time.sleep(1)
                load_event_end = self.driver.execute_script("return window.performance.timing.loadEventEnd")

            if navigation_start > 0 and load_event_end > 0:
                load_time_ms = load_event_end - navigation_start
                load_time_sec = load_time_ms / 1000
                print(f"[TIME] Page Load Time: {load_time_sec:.3f} seconds")
                return load_time_sec
            else:
                print("[WARN] Could not calculate load time (invalid timing values).")
                return 0
        except Exception as e:
            print(f"[WARN] Error calculating load time: {e}")
            return 0
