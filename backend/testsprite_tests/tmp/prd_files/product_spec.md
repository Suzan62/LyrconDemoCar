# Lyrcon DMS - Product Specification & Overview

## 1. Executive Summary
**Lyrcon DMS (Dealer Management System)**, also known as "DemoCar", is a comprehensive, modern web application designed for automotive dealerships. It serves as a unified command center for managing the entire vehicle lifecycle—from acquisition (purchasing old cars or adding new stock) to sales, finance management, and customer relationship management (CRM).

The product differentiates itself with a premium, high-contrast aesthetic ("Dark/Light Mode" optimized), fluid animations, and robust automation features like VIN decoding and real-time sales forecasting.

---

## 2. Product Purpose
The primary goal of Lyrcon DMS is to **streamline dealership operations** by:
- **Digitizing Paperwork**: Removing manual logs for RTO, Insurance, and Sales dockets.
- **Automating Data Entry**: Using APIs to fetch vehicle details via VIN to reduce errors.
- **Centralizing Data**: Keeping Finances, Inventory, and Customer Inquiries in one synchronized database.
- **Enhancing Decisions**: Providing actionable insights through interactive dashboards and sales forecasting.

---

## 3. User Roles & Access
*   **Admin/Manager**: Full access to all modules, financial data, and user settings.
*   **Sales Executive**: Access to Inventory, Inquiries, and creating Sales transactions.
*   **Field Agent**: Access to specific Mobile KYC workflows for customer verification.

---

## 4. Core Features & Workflows

### A. Dashboard (The Command Center)
A visual landing page enabling quick business health checks.
*   **Key Metrics**: Real-time counters for Total Revenue, Active Inquiries, and Vehicles Sold.
*   **Sales Forecasting**: Interactive visualizations (Charts) predicting future sales trends based on historical data.
*   **Quick Actions**: One-click access to add inventory or check pending tasks.

### B. Inventory Management
The heart of the application, managing the fleet state.
*   **Universal "Add Car" Interface**: A unified form handling three distinct transaction types:
    1.  **New Car Entry**: Logging brand new vehicles with delivery dates and executive allocations.
    2.  **Purchase (Used Car Acquisition)**: Buying used cars from sellers. Features **Document Uploads** (RC Book, Insurance, PAN, NOC) handling multipart form data.
    3.  **Sale**: Selling a vehicle. Includes **Auto-Fill** logic to select an existing inventory item and populate technical specs, then capturing Buyer Details (Name, Address) and Brokerage Information.
*   **Smart VIN Decoding**: Entering a 17-digit VIN automatically fetches Manufacturer, Model, Year, and Fuel Type from the NHTSA database, reducing data entry time by 80%.
*   **Live Search & Filters**: Instant filtering by Status (Available, Sold) or Type (New, Purchase) to locate stock immediately.

### C. Finance & Loans
*   **Loan Management**: specific module to track vehicle loans, EMI schedules, and disbursement amounts.
*   **Protection Plans**: Tracking of Loan Protection insurance and bank branches.

### D. CRM (Inquiries)
*   **Lead Tracking**: Capture potential buyers, their preferred models, and budget range.
*   **Status Workflow**: Move leads through stages (New -> Contacted -> Test Drive -> Converted).

### E. Specialized Modules
*   **Mobile KYC**: A dedicated workflow for verifying customer identity.
    *   **Step-by-Step UI**: Progress stepper for Personal Info -> ID Upload (Aadhaar/PAN) -> Face Verification.
    *   **Camera Integration**: Built to work seamlessly on mobile devices for on-lot verification.
*   **RTO Management**: Tracking the status of Regional Transport Office passing (Pending -> In-Progress -> Completed).

---

## 5. Technical Architecture (Under the Hood)
*   **Frontend**: React.js with **Redux Toolkit** for robust state management. Uses **Tailwind CSS** for a bespoke, responsive design.
*   **Backend**: Python **Flask** API server.
*   **Database**: **PostgreSQL** (via SQLAlchemy) for reliable, relational data integrity.
*   **Quality Assurance**: Industry-standard **Selenium E2E Automation** suite ensuring critical flows (like Purchase/Sales) never break during updates.

---

## 6. Future Roadmap
*   **AI Insights**: Deeper integration of ML for pricing suggestions based on car condition and market trends.
*   **Customer Portal**: A public-facing view for customers to browse available inventory directly.
