# 🪡 Cottonil Executive Analytics & Sales Forecasting Suite

[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An end-to-end Enterprise Business Intelligence (BI) and Machine Learning Sales Forecasting platform built for **Cottonil Egypt**. This repository features end-to-end ETL processing, extensive exploratory data analysis (EDA), multi-model time-series forecasting (Company & Branch levels), and an interactive FastAPI-powered Executive Dashboard.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Dataset & Schema](#-dataset--schema)
- [Forecasting Models & Evaluation](#-forecasting-models--evaluation)
- [Executive Dashboard](#-executive-dashboard)
- [Project Directory Structure](#-project-directory-structure)
- [Installation & Getting Started](#-installation--getting-started)
- [Usage Guide](#-usage-guide)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🌟 Overview

Cottonil is one of the leading apparel and textile manufacturers and retail distributors in Egypt and the MENA region. This project delivers high-impact decision support for senior leadership, inventory managers, and supply chain directors by addressing critical retail challenges:

1. **Holistic Enterprise Analytics**: Merging sales transactions, customer demographics, branch operations, supply chain logistics, and operating expenditures (OPEX & payroll).
2. **Predictive Sales Forecasting**: Multi-horizon forecasting at both the aggregated company level and individual branch levels to optimize inventory replenishment and reduce stockouts.
3. **Interactive Executive Portal**: A web-based executive dashboard built in FastAPI, HTML5, Chart.js, and CSS adhering to Cottonil's brand identity.

---

## 🚀 Key Features

- **End-to-End Analytics Pipeline**:
  - Processing transaction tables spanning customers, sales orders, shipments, returns, stock levels, and expenses.
  - Aggregation to daily and monthly analytical datasets.
- **Advanced Machine Learning & Econometric Forecasting**:
  - **Company-Level Demand**: Univariate time-series modeling with **SARIMA** and **Prophet**.
  - **Branch-Level Granular Demand**: Machine learning regressors (**XGBoost**, **Random Forest**) paired with moving averages and seasonal baseline benchmarks.
  - Rigorous backtesting with strict temporal train/validation/test splits preventing future lookahead bias.
  - Benchmark performance metrics: **MAE**, **RMSE**, **MAPE**, and **WAPE**.
- **Interactive Web Dashboard**:
  - **Executive KPIs**: Real-time overview of revenue, order volume, average order value (AOV), active customer counts, inventory valuations, and net margins.
  - **Predictive Scenarios & Outlook**: Dynamic forecasting simulator enabling custom growth scenarios and branch comparisons.
  - **Branch Intelligence**: Geographic and performance tier rankings with automated next-month outlook alerts.
  - **Inventory Health & Stockout Risk**: Category-wise stock valuation vs. demand burn rates.
  - **RESTful API**: Clean API endpoints serving frontend widgets and external integrations.

---

## 🏗 System Architecture

```text
  ┌──────────────────────────────────────────────────────────────┐
  │                    COTTONIL Raw ERP Data                     │
  │    (Sales, Customers, Branches, Inventory, OPEX, Payroll)     │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                ETL & Data Science Pipelines                  │
  │   - Cottonil_analysis.ipynb (EDA & Performance Profiling)    │
  │   - cottonil_sales_forecasting.ipynb (Feature Eng & Models)  │
  └──────────────────────────────┬───────────────────────────────┘
                                 │ Generates Model Weights & Aggregations
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                   Outputs & Artifacts Store                  │
  │   - Models: SARIMA, Prophet, XGBoost, Random Forest (.joblib)│
  │   - Aggregated Data: daily_sales.csv, monthly_sales.csv      │
  │   - Reports: next_month_outlook.csv, model_comparison.csv    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                  FastAPI Backend Engine                      │
  │   - data_service.py (Aggregations, Metrics & KPIs)           │
  │   - forecast_service.py (Inference Engine & Model Scoring)   │
  │   - app.py (REST API & Web Routing)                          │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │              Executive Presentation Dashboard                │
  │   - HTML5 / CSS3 (Cottonil Brand Identity)                   │
  │   - Vanilla JS + Chart.js Interactive Visualizations         │
  └──────────────────────────────────────────────────────────────┘
```

---

## 📂 Dataset & Schema

The underlying data schema models a full-scale retail ERP system:

| Table Category | Key Files | Description |
| :--- | :--- | :--- |
| **Sales & Commerce** | `sales_orders.csv`, `sales_order_items.csv`, `sales_payments.csv`, `sales_returns.csv` | Core transaction ledger, line items, payment methods, and customer returns. |
| **Catalog & Inventory**| `products_catalog.csv`, `sku_variants.csv`, `monthly_stock.csv`, `inventory_transfers.csv` | Product hierarchies, size/color SKUs, monthly branch inventory levels, and inter-store movements. |
| **Entity Dimensions** | `branches.csv`, `customers.csv`, `employees.csv`, `warehouses.csv`, `factories.csv` | Store locations, customer demographics, staffing rosters, and distribution hubs. |
| **Procurement & Supply** | `purchase_orders.csv`, `purchase_order_items.csv`, `suppliers.csv`, `import_shipments.csv` | Vendor purchases, raw materials/finished goods inbound, and customs tracking. |
| **Financials & OPEX** | `operating_expenses.csv`, `payroll.csv` | Rent, utilities, marketing campaigns, and salary structures for margin calculations. |

---

## 📈 Forecasting Models & Evaluation

The predictive engine employs a disciplined temporal split:
- **Training Set**: Historical data up to `2023-12`
- **Validation Set**: `2024-01` through `2024-12`
- **Test Set**: Post-2024 holdout evaluation period

### Benchmark Comparison

Models are ranked and selected based on **Weighted Absolute Percentage Error (WAPE)** and **Root Mean Squared Error (RMSE)**:

- **Aggregated Company Level**: **SARIMA** achieves superior performance with a Validation WAPE of **~3.52%**, effectively capturing nationwide seasonality and holiday spikes.
- **Branch Level**: Evaluated across **Baseline Moving Averages (MA-3)**, **Lagged Models**, **Random Forest Regressors**, and **XGBoost Regressors**. Moving average baselines provide highly stable operational benchmarks, while ensemble trees model nonlinear covariate interactions.

---

## 💻 Executive Dashboard

The interactive dashboard provides a modern web interface styled in Cottonil's official brand palette:

- **Executive KPI Ribbon**: Revenue, orders, average transaction value, customer metrics, and estimated net margin.
- **Sales Trend & Seasonality Chart**: Historical revenue trajectories with breakdown across regions.
- **Interactive Forecast Simulator**: Adjust parameters to forecast upcoming revenue under various growth scenarios.
- **Branch Performance Matrix**: Searchable, filterable list of branches with operational flags, target attainment, and next-month outlooks.
- **Inventory & Supply Chain Monitor**: Category-level stock distribution and safety-stock monitoring.

---

## 📁 Project Directory Structure

```plaintext
COTTONIL/
│
├── COTTONIL_Data/               # Source relational CSV datasets
│   ├── 01_CATALOG/              # Reference product catalog
│   └── 02_TABLES/               # Relational ERP transaction tables
│
├── dashboard/                   # FastAPI Web Application
│   ├── app.py                   # FastAPI routing and API endpoints
│   ├── data_service.py          # Data ingestion, caching, and KPI logic
│   ├── forecast_service.py      # ML inference and model evaluation service
│   ├── static/
│   │   ├── css/style.css        # Responsive styling (Cottonil Navy/Blue theme)
│   │   └── js/main.js           # Chart.js integration, client-side rendering
│   └── templates/
│       └── index.html           # Unified executive dashboard view
│
├── outputs/                     # Processed models, data, and analytical reports
│   ├── data/                    # Pre-aggregated daily and monthly sales CSVs
│   ├── models/                  # Serialized ML & Time-Series models (.joblib)
│   │   ├── sarima_company.joblib
│   │   ├── prophet_company.joblib
│   │   ├── best_branch_monthly.joblib
│   │   ├── xgb_branch_monthly.joblib
│   │   ├── rf_branch_monthly.joblib
│   │   └── best_daily.joblib
│   └── reports/                 # Evaluation metrics, feature importances, outlooks
│       ├── model_comparison.csv
│       ├── branch_test_metrics.csv
│       ├── next_month_outlook.csv
│       └── evaluation_report.json
│
├── Cottonil_analysis.ipynb      # In-depth Exploratory Data Analysis & Visualizations
├── cottonil_sales_forecasting.ipynb # Feature Engineering, Model Training & Benchmarking
├── run_dashboard.py             # Server launcher with automatic port discovery
└── README.md                    # Project documentation
```

---

## ⚙️ Installation & Getting Started

### 1. Prerequisites
- Python **3.10+**
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/cottonil-analytics.git
cd cottonil-analytics
```

### 3. Create and Activate a Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies
Install the required packages:
```bash
pip install fastapi uvicorn pandas numpy scikit-learn xgboost statsmodels prophet joblib jinja2 matplotlib seaborn
```

---

## 🚦 Usage Guide

### Launching the Interactive Dashboard
Run the dashboard launcher script:
```bash
python run_dashboard.py
```
The server will automatically detect an available port (defaulting to port `8000`) and launch:
```text
=====================================================================
 Cottonil Executive Dashboard & Sales Forecasting Suite
 Designed with Cottonil brand identity (Navy/Royal Blue & Pure White)
 Access URL: http://127.0.0.1:8000
=====================================================================
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your web browser.

### Running Analytics & Training Pipelines
- **Exploratory Data Analysis**:
  Open and run `Cottonil_analysis.ipynb` in Jupyter Notebook or VS Code to explore customer segmentation, channel sales distribution, return rates, and branch metrics.
- **Model Training & Retraining**:
  Open and run `cottonil_sales_forecasting.ipynb` to re-execute ETL, generate updated feature matrices, retrain SARIMA/XGBoost/Random Forest models, and export new artifacts to the `outputs/` directory.

---

## 📄 License & Acknowledgements

- **License**: Distributed under the [MIT License](LICENSE).
- **Brand & Data**: Built for academic and enterprise demonstration using Cottonil retail operational schemas. All rights to the Cottonil trademark belong to their respective owners.
