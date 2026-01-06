from .base_page import BasePage
from selenium.webdriver.common.by import By
from selenium.webdriver import ActionChains

class DashboardPage(BasePage):
    URL = "http://localhost:5173/"
    HEADER = (By.XPATH, "//*[contains(text(), 'Dashboard')]")
    TOTAL_REVENUE = (By.XPATH, "//*[contains(text(), 'Total Revenue')]/../../..//div[contains(@class, 'text-2xl')]")
    CARS_SOLD = (By.XPATH, "//*[contains(text(), 'Cars Sold')]/../../..//div[contains(@class, 'text-2xl')]")
    CHART = (By.CLASS_NAME, "recharts-surface")
    CHART_TOOLTIP = (By.CLASS_NAME, "recharts-tooltip-item") # Typical Recharts tooltip class

    def load(self):
        self.open_url(self.URL)

    def is_loaded(self):
        try:
            self.find_element(self.HEADER)
            return True
        except:
            return False

    def get_revenue_value(self):
        return self.get_text(self.TOTAL_REVENUE)

    def get_cars_sold_value(self):
        return self.get_text(self.CARS_SOLD)

    def hover_over_chart(self):
        """Interacts with the chart to trigger tooltip."""
        chart = self.find_element(self.CHART)
        actions = ActionChains(self.driver)
        # Move to center of chart to likely hit a data point
        actions.move_to_element(chart).perform()
    
    def is_tooltip_visible(self):
        try:
            # Recharts tooltips are often dynamically added to DOM
            self.find_element((By.CLASS_NAME, "recharts-tooltip-wrapper"))
            return True
        except:
            return False
