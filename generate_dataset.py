import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

def generate_car_sales_data(start_date='2020-01-01', end_date='2023-12-31', output_file='car_sales_4yrs.csv'):
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    delta = end - start
    
    dates = []
    sales = []
    
    np.random.seed(42)
    
    # 3 lakh to 40 lakh car prices in INR
    price_min = 300000 
    price_max = 4000000 
    
    for i in range(delta.days + 1):
        current_date = start + timedelta(days=i)
        
        # Base number of cars sold per day (1 to 5)
        # Weekends sell more
        is_weekend = current_date.weekday() >= 5
        
        # Seasonality: higher in March, October, November (festivals/year-end)
        month_factor = 1.0
        if current_date.month in [3, 10, 11]:
            month_factor = 1.3
        
        # Trend: slightly increasing over 4 years
        trend_factor = 1.0 + (i / 1460) * 0.2
        
        base_cars = np.random.poisson(3.0) 
        if is_weekend:
            base_cars += np.random.poisson(2.0)
            
        cars_sold = int(base_cars * month_factor * trend_factor)
        
        # If no cars sold, still add a record occasionally? No, just sum prices.
        daily_sales = 0
        for _ in range(cars_sold):
            # Normally distributed around 10 Lakhs
            price = np.random.normal(loc=1200000, scale=400000)
            price = max(price_min, min(price_max, price))
            daily_sales += price
            
        if cars_sold > 0:
            dates.append(current_date.strftime('%Y-%m-%d'))
            sales.append(round(daily_sales, 2))
            
    df = pd.DataFrame({'date': dates, 'sales': sales})
    df.to_csv(output_file, index=False)
    print(f"Generated {len(df)} days of car sales data with large values.")
    print(f"Saved to {output_file}")

if __name__ == '__main__':
    generate_car_sales_data()
