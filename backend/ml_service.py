
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.ensemble import RandomForestRegressor
from sklearn.base import BaseEstimator, TransformerMixin
import joblib
import os
from datetime import datetime
from dateutil.relativedelta import relativedelta

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

class MLService:
    def __init__(self):
        self.model = None
        self.load_model()

    def get_db_connection(self):
        return create_engine(DATABASE_URL).connect()

    def load_data(self):
        """Extracts sales data from new_cars and old_cars_sell tables."""
        try:
            with self.get_db_connection() as conn:
                # Query New Cars Sales
                # Filter out invalid years (e.g. 0025)
                query_new = text("""
                    SELECT booking_date as date, ex_showroom_price as price
                    FROM new_cars 
                    WHERE entry_type = 'sales' 
                    AND booking_date IS NOT NULL
                    AND booking_date >= '2020-01-01'
                """)
                df_new = pd.read_sql(query_new, conn)

                # Query Old Cars Sales
                query_old = text("""
                    SELECT created_at as date, current_price as price
                    FROM old_cars_sell
                    WHERE created_at IS NOT NULL
                    AND created_at >= '2020-01-01'
                """)
                df_old = pd.read_sql(query_old, conn)
                
                # Combine
                df = pd.concat([df_new, df_old], ignore_index=True)
                
                # Convert date to datetime
                df['date'] = pd.to_datetime(df['date'])
                
                # Aggregate by Month
                df['month_year'] = df['date'].dt.to_period('M')
                monthly_sales = df.groupby('month_year')['price'].sum().reset_index()
                monthly_sales['month_year'] = monthly_sales['month_year'].dt.to_timestamp()
                monthly_sales = monthly_sales.sort_values('month_year')
                
                return monthly_sales
        except Exception as e:
            print(f"Error loading data: {e}")
            return pd.DataFrame()

    def preprocess_features(self, df):
        """Creates lag features for time series forecasting."""
        df['month_index'] = np.arange(len(df))
        # Create rolling average feature (3 months)
        df['rolling_mean_3'] = df['price'].rolling(window=3).mean().shift(1)
        df = df.dropna() # Drop rows with NaN from rolling
        return df

    def train_model(self):
        """Trains the Random Forest model and saves it."""
        df = self.load_data()
        
        if len(df) < 10:
            return {"status": "error", "message": "Insufficient data (need > 10 months of sales)"}
            
        df_processed = self.preprocess_features(df.copy())
        
        X = df_processed[['month_index', 'rolling_mean_3']]
        y = df_processed['price']
        
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        
        # Save model
        joblib.dump(self.model, MODEL_PATH)
        return {"status": "success", "message": "Model trained successfully"}

    def load_model(self):
        """Loads the trained model from disk."""
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)

    def forecast(self, months=6):
        """Generates forecast for the next 'months'."""
        df = self.load_data()
        
        if df.empty or len(df) < 10:
            return None

        # Prepare history data for chart
        history_data = []
        for _, row in df.iterrows():
            history_data.append({
                "name": row['month_year'].strftime('%b %Y'),
                "sales": row['price'],
                "prediction": None
            })

        if not self.model:
            train_result = self.train_model()
            if train_result['status'] == 'error':
                return {"history": history_data, "forecast": [], "status": "insufficient_data"}

        # Future Prediction
        last_month_index = len(df) - 1
        last_rolling_mean = df['price'].rolling(window=3).mean().iloc[-1]
        
        future_data = []
        current_rolling = last_rolling_mean
        
        last_date = df['month_year'].iloc[-1]
        
        for i in range(1, months + 1):
            next_month_index = last_month_index + i
            
            # Predict
            pred_price = self.model.predict([[next_month_index, current_rolling]])[0]
            
            # Simple Confidence Interval (Fixed 10% for now as RF standard deviation is complex without quantile regression)
            # For a more robust solution we'd use GradientBoostingRegressor with quantile loss, 
            # but for this MVP a fixed margin based on variance is acceptable or just +/- 10%
            lower_bound = pred_price * 0.9
            upper_bound = pred_price * 1.1
            
            next_date = last_date + relativedelta(months=i)
            
            future_data.append({
                "name": next_date.strftime('%b %Y'),
                "sales": None,
                "prediction": round(pred_price, 2),
                "lower_bound": round(lower_bound, 2),
                "upper_bound": round(upper_bound, 2)
            })
            
            # Update rolling mean roughly for next step
            # This is a simplification; correct way is recursive multi-step forecasting
            current_rolling = (current_rolling * 2 + pred_price) / 3

        return {
            "history": history_data,
            "forecast": future_data,
            "status": "success"
        }

ml_service = MLService()
