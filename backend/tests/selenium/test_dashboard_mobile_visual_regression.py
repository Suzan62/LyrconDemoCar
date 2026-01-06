from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
from utils import login_to_app

def test_dashboard_mobile_visual_regression():
    """
    Visual regression test for Dashboard on mobile screens
    """
    chrome_options = Options()
    chrome_options.add_argument("--log-level=3")

    # Mobile device emulation
    mobile_emulation = {
        "deviceMetrics": {"width": 375, "height": 667, "pixelRatio": 2.0},
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
    }
    chrome_options.add_experimental_option("mobileEmulation", mobile_emulation)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    wait = WebDriverWait(driver, 20)

    screenshots_dir = "tests/selenium/screenshots"
    os.makedirs(screenshots_dir, exist_ok=True)

    issues = []

    try:
        # Login and navigate to dashboard
        login_to_app(driver)
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Dashboard')]")))

        # Take screenshot
        screenshot_path = os.path.join(screenshots_dir, "dashboard_mobile.png")
        driver.save_screenshot(screenshot_path)
        print(f"✅ Mobile screenshot saved: {screenshot_path}")

        # Check for layout issues
        # Check if dashboard header is visible
        try:
            header = driver.find_element(By.XPATH, "//*[contains(text(), 'Dashboard')]")
            if not header.is_displayed():
                issues.append("Dashboard header not visible on mobile")
        except:
            issues.append("Dashboard header not found on mobile")

        # Check for horizontal scroll (layout break indicator)
        scroll_width = driver.execute_script("return document.body.scrollWidth")
        window_width = driver.execute_script("return window.innerWidth")
        if scroll_width > window_width:
            issues.append(f"Horizontal scroll detected: {scroll_width}px content width vs {window_width}px viewport")

        # Check chart visibility
        try:
            chart = driver.find_element(By.CLASS_NAME, "recharts-surface")
            if not chart.is_displayed():
                issues.append("Chart not visible on mobile")
        except:
            issues.append("Chart element not found on mobile")

        # Check stats visibility
        stats_selectors = [
            "//*[contains(text(), 'Total Revenue')]",
            "//*[contains(text(), 'Cars Sold')]"
        ]
        for selector in stats_selectors:
            try:
                stat = driver.find_element(By.XPATH, selector)
                if not stat.is_displayed():
                    issues.append(f"Stat not visible: {selector}")
            except:
                issues.append(f"Stat not found: {selector}")

        # Report results
        print("\n" + "="*50)
        print("MOBILE VISUAL REGRESSION TEST RESULTS")
        print("="*50)

        if issues:
            print(f"❌ Found {len(issues)} layout issues:")
            for issue in issues:
                print(f"  - {issue}")
            return False
        else:
            print("✅ No layout issues detected on mobile")
            print(f"📸 Screenshot saved at: {screenshot_path}")
            return True

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        issues.append(f"Test execution error: {e}")
        return False
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    success = test_dashboard_mobile_visual_regression()
    exit(0 if success else 1)