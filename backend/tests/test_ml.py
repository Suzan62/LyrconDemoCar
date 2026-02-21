
import unittest
import sys
import os
import pandas as pd

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_service import MLService

class TestMLService(unittest.TestCase):
    def setUp(self):
        self.ml_service = MLService()

    def test_data_loading(self):
        df = self.ml_service.load_data()
        print(f"\nLoaded {len(df)} monthly records.")
        self.assertIsInstance(df, pd.DataFrame)
        if not df.empty:
            self.assertIn('price', df.columns)
            self.assertIn('month_year', df.columns)

    def test_forecast_structure(self):
        result = self.ml_service.forecast(months=2)
        
        if not result and len(self.ml_service.load_data()) < 10:
             print("\nSkipping forecast test due to insufficient data.")
             return

        self.assertIsNotNone(result)
        self.assertIn('history', result)
        self.assertIn('forecast', result)
        self.assertEqual(len(result['forecast']), 2)
        
        # Check forecast item structure including confidence intervals
        first_forecast = result['forecast'][0]
        self.assertIn('prediction', first_forecast)
        self.assertIn('lower_bound', first_forecast)
        self.assertIn('upper_bound', first_forecast)
        print(f"\nForecast Test Output: {first_forecast}")

if __name__ == '__main__':
    unittest.main()
