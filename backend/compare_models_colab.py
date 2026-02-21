import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.model_selection import TimeSeriesSplit

# Set style for plots
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (15, 10)

def generate_dataset(type='trend', n_months=60):
    """Generates synthetic sales data for testing."""
    dates = pd.date_range(start='2020-01-01', periods=n_months, freq='M')
    df = pd.DataFrame({'date': dates})
    df['month_index'] = np.arange(len(df))
    
    # Base Randomness
    noise = np.random.normal(0, 10, n_months) * 1000  # Random noise
    
    if type == 'trend':
        # Linear growth: Sales increase by 5000 every month
        df['sales'] = 500000 + (df['month_index'] * 5000) + noise
        df['inventory'] = 20 + (df['month_index'] * 0.5) + np.random.normal(0, 2, n_months) # Inventory grows with sales
        
    elif type == 'seasonal':
        # Seasonal: Peaks every 12 months (e.g. Festival season)
        seasonality = 100000 * np.sin(2 * np.pi * df['month_index'] / 12)
        df['sales'] = 500000 + seasonality + (df['month_index'] * 2000) + noise
        df['inventory'] = 30 + 10 * np.sin(2 * np.pi * df['month_index'] / 12) # Inventory matches season
        
    elif type == 'complex':
        # Volatile: Random spikes, inventory shortages affecting sales
        inventory = np.random.randint(5, 50, n_months)
        df['inventory'] = inventory
        # Sales depend heavily on inventory (Inventory * 20,000) + random
        df['sales'] = (inventory * 20000) + noise + 200000
        
    return df

# Create 3 Datasets
datasets = {
    "Dataset A (Linear Growth)": generate_dataset('trend'),
    "Dataset B (Seasonal/Festive)": generate_dataset('seasonal'),
    "Dataset C (Inventory Constraint)": generate_dataset('complex')
}

print("✅ Datasets Generated Successfully!")

# ==========================================
# 2. FEATURE ENGINEERING
# ==========================================
def create_features(df):
    df = df.copy()
    
    # Feature 1: Lag (Sales 12 months ago) - Captures YoY trends
    df['lag_12'] = df['sales'].shift(12)
    
    # Feature 2: Lag (Sales 1 month ago) - Captures immediate trend
    df['lag_1'] = df['sales'].shift(1)
    
    # Feature 3: Rolling Mean (3 months) - Smooths noise
    df['rolling_mean_3'] = df['sales'].rolling(window=3).mean().shift(1)
    
    # Feature 4: Seasonality
    df['month_sin'] = np.sin(2 * np.pi * df['date'].dt.month / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['date'].dt.month / 12)
    
    # Drop NaN created by lags
    df = df.dropna()
    return df

print("✅ Feature Engineering Functions Ready!")

# ==========================================
# 3. TRAINING & COMPARISON ENGINE
# ==========================================
def compare_models(name, df):
    print(f"\n--- Analyzing {name} ---")
    data = create_features(df)
    
    # Split Train/Test (Last 12 months as test)
    train = data.iloc[:-12]
    test = data.iloc[-12:]
    
    feature_cols = ['month_index', 'inventory', 'lag_12', 'lag_1', 'rolling_mean_3', 'month_sin', 'month_cos']
    X_train, y_train = train[feature_cols], train['sales']
    X_test, y_test = test[feature_cols], test['sales']
    
    models = {
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
        "Linear Regression": LinearRegression()
    }
    
    results = {}
    best_model_name = ""
    best_loss = float('inf')
    predictions = {}
    
    # Train & Evaluate
    for model_name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        results[model_name] = rmse
        predictions[model_name] = preds
        
        if rmse < best_loss:
            best_loss = rmse
            best_model_name = model_name
            
    print(f"🏆 Winner: {best_model_name} (RMSE: {best_loss:,.0f})")
    
    # Visualization
    fig, axes = plt.subplots(1, 2, figsize=(18, 6))
    
    # Plot 1: Forecast Comparison
    axes[0].plot(train['date'], train['sales'], label='Training History', color='black', alpha=0.3)
    axes[0].plot(test['date'], y_test, label='Actual Sales', color='black', linewidth=2, linestyle='--')
    
    colors = {'Random Forest': 'green', 'Gradient Boosting': 'blue', 'Linear Regression': 'red'}
    for model_name, preds in predictions.items():
        axes[0].plot(test['date'], preds, label=f"{model_name} (Err: {results[model_name]:.0f})", color=colors[model_name])
        
    axes[0].set_title(f"Forecast Comparison: {name}")
    axes[0].legend()
    axes[0].set_ylabel("Sales Volume")
    
    # Plot 2: Feature Importance (Winner Model)
    # Note: Linear Regression doesn't have feature_importances_ attribute same way, so we check
    if hasattr(models[best_model_name], 'feature_importances_'):
        importances = models[best_model_name].feature_importances_
        feature_imp = pd.DataFrame({'Feature': feature_cols, 'Importance': importances})
        feature_imp = feature_imp.sort_values(by='Importance', ascending=False)
        
        sns.barplot(x='Importance', y='Feature', data=feature_imp, ax=axes[1], palette='viridis')
        axes[1].set_title(f"Why did {best_model_name} win? (Feature Importance)")
    else:
        # For Linear regression, show coefficients
        importances = np.abs(models[best_model_name].coef_)
        feature_imp = pd.DataFrame({'Feature': feature_cols, 'Importance': importances})
        feature_imp = feature_imp.sort_values(by='Importance', ascending=False)
        sns.barplot(x='Importance', y='Feature', data=feature_imp, ax=axes[1], palette='magma')
        axes[1].set_title(f"Feature Coefficients ({best_model_name})")
        
    plt.tight_layout()
    plt.show()

# ==========================================
# 4. RUN EXPERIMENTS
# ==========================================
for name, df in datasets.items():
    compare_models(name, df)
