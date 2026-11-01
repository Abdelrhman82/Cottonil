"""
Data Service for Cottonil Executive Dashboard.
Aggregates sales, customers, branches, inventory, and profitability.
"""
import os
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "COTTONIL_Data", "02_TABLES")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

class DashboardDataService:
    def __init__(self):
        self._cache = {}
        self.load_data()

    def load_data(self):
        print("Loading dashboard datasets...")
        # Branches
        branches_path = os.path.join(DATA_DIR, "branches.csv")
        self.branches_df = pd.read_csv(branches_path)
        
        # Customers
        customers_path = os.path.join(DATA_DIR, "customers.csv")
        self.customers_df = pd.read_csv(customers_path)
        
        # Monthly Stock
        stock_path = os.path.join(DATA_DIR, "monthly_stock.csv")
        self.stock_df = pd.read_csv(stock_path)
        
        # Operating Expenses & Payroll
        exp_path = os.path.join(DATA_DIR, "operating_expenses.csv")
        self.expenses_df = pd.read_csv(exp_path)
        self.expenses_df['year_month'] = pd.to_datetime(self.expenses_df['expense_date']).dt.to_period('M').astype(str)
        
        pay_path = os.path.join(DATA_DIR, "payroll.csv")
        self.payroll_df = pd.read_csv(pay_path)
        
        # Monthly & Daily Sales aggregated
        monthly_sales_path = os.path.join(OUTPUTS_DIR, "data", "monthly_sales.csv")
        self.monthly_sales_df = pd.read_csv(monthly_sales_path)
        
        daily_sales_path = os.path.join(OUTPUTS_DIR, "data", "daily_sales.csv")
        self.daily_sales_df = pd.read_csv(daily_sales_path)

        # Outlook & Model report
        outlook_path = os.path.join(OUTPUTS_DIR, "reports", "next_month_outlook.csv")
        if os.path.exists(outlook_path):
            self.outlook_df = pd.read_csv(outlook_path)
        else:
            self.outlook_df = pd.DataFrame()

        eval_report_path = os.path.join(OUTPUTS_DIR, "reports", "evaluation_report.json")
        if os.path.exists(eval_report_path):
            with open(eval_report_path, "r", encoding="utf-8") as f:
                self.eval_report = json.load(f)
        else:
            self.eval_report = {}

        print("Dashboard datasets successfully loaded.")

    def get_kpis(self):
        """Top-level Executive KPIs across Cottonil."""
        # Calculate YTD / total sales (using 2026 as current year)
        df_2026 = self.monthly_sales_df[self.monthly_sales_df['year_month'].str.startswith("2026")]
        ytd_sales = float(df_2026['sales_amount'].sum())
        
        # Latest complete month (2026-09) and current partial (2026-10)
        m_sep = self.monthly_sales_df[self.monthly_sales_df['year_month'] == '2026-09']
        m_aug = self.monthly_sales_df[self.monthly_sales_df['year_month'] == '2026-08']
        sep_sales = float(m_sep['sales_amount'].sum())
        aug_sales = float(m_aug['sales_amount'].sum())
        mom_growth = ((sep_sales - aug_sales) / aug_sales * 100) if aug_sales > 0 else 0.0

        # Customer count
        total_customers = int(len(self.customers_df))
        customer_segments = self.customers_df['customer_segment'].value_counts().to_dict()

        # Branch count & Active branches
        total_branches = int(len(self.branches_df))

        # Total Current Inventory Value & Units
        latest_stock_month = self.stock_df['year_month'].max()
        latest_stock = self.stock_df[self.stock_df['year_month'] == latest_stock_month]
        total_stock_value = float(latest_stock['closing_stock_value_EGP'].sum())
        total_stock_units = int(latest_stock['closing_units'].sum())
        high_risk_stock_count = int((latest_stock['stockout_risk_score'] > 0.7).sum())

        # Profitability summary (2026 YTD)
        exp_2026 = float(self.expenses_df[self.expenses_df['year_month'].str.startswith("2026")]['amount_EGP'].sum())
        pay_2026 = float(self.payroll_df[self.payroll_df['pay_month'].str.startswith("2026")]['net_paid_EGP'].sum())
        total_costs_2026 = exp_2026 + pay_2026
        est_net_profit_2026 = ytd_sales - total_costs_2026
        profit_margin_pct = (est_net_profit_2026 / ytd_sales * 100) if ytd_sales > 0 else 0.0

        # ML Forecast Next Month Company (SARIMA / baseline)
        next_month_fcst = self.eval_report.get("next_month_company", {})
        month_end_fcst = self.eval_report.get("month_end_company", {})

        return {
            "ytd_sales_egp": ytd_sales,
            "latest_month_sales_egp": sep_sales,
            "mom_growth_pct": round(mom_growth, 2),
            "total_customers": total_customers,
            "customer_segments": customer_segments,
            "total_branches": total_branches,
            "total_stock_value_egp": total_stock_value,
            "total_stock_units": total_stock_units,
            "high_risk_stockout_items": high_risk_stock_count,
            "total_opex_payroll_2026": total_costs_2026,
            "est_operating_profit_2026": est_net_profit_2026,
            "profit_margin_pct": round(profit_margin_pct, 2),
            "forecast_next_month_egp": next_month_fcst.get("forecasted_monthly_sales", 32690474.0),
            "forecast_month_end_egp": month_end_fcst.get("expected_final_monthly_sales", 28804001.0)
        }

    def get_sales_trends(self):
        """Monthly aggregated trend for the company with year-over-year comparison."""
        grouped = self.monthly_sales_df.groupby('year_month').agg({
            'sales_amount': 'sum',
            'net_sales': 'sum',
            'order_count': 'sum'
        }).reset_index()
        
        # Sort and take recent 24-36 months
        grouped = grouped.sort_values('year_month')
        recent = grouped.tail(36).to_dict(orient='records')
        return recent

    def get_branch_performance(self):
        """Branch ranking, sales, governorate, retail type, growth."""
        # 2026 total sales per branch
        df_2026 = self.monthly_sales_df[self.monthly_sales_df['year_month'].str.startswith("2026")]
        b_sales = df_2026.groupby('branch_id').agg({
            'sales_amount': 'sum',
            'order_count': 'sum',
            'items_count': 'sum'
        }).reset_index()

        # Merge with branch info
        merged = pd.merge(self.branches_df, b_sales, on='branch_id', how='left').fillna(0)
        
        # Merge with ML outlook if available
        if not self.outlook_df.empty:
            outlook_clean = self.outlook_df[['branch_id', 'forecast', 'vs_prev_pct', 'vs_ly_pct', 'method']].copy()
            merged = pd.merge(merged, outlook_clean, on='branch_id', how='left')
        
        merged['sales_amount'] = merged['sales_amount'].round(2)
        merged = merged.sort_values('sales_amount', ascending=False)
        return merged.to_dict(orient='records')

    def get_inventory_summary(self):
        """Inventory breakdown by product category, stock value, units, stockout risk."""
        latest_stock_month = self.stock_df['year_month'].max()
        latest = self.stock_df[self.stock_df['year_month'] == latest_stock_month]

        cat_summary = latest.groupby('product_category').agg({
            'closing_units': 'sum',
            'closing_stock_value_EGP': 'sum',
            'stockout_risk_score': 'mean'
        }).reset_index()
        cat_summary['stockout_risk_score'] = cat_summary['stockout_risk_score'].round(3)
        cat_summary['closing_stock_value_EGP'] = cat_summary['closing_stock_value_EGP'].round(2)

        # Risk distribution
        high_risk = latest[latest['stockout_risk_score'] >= 0.7].copy()
        high_risk_list = high_risk.sort_values('stockout_risk_score', ascending=False).head(15).to_dict(orient='records')

        return {
            "latest_month": latest_stock_month,
            "categories": cat_summary.to_dict(orient='records'),
            "high_risk_locations": high_risk_list
        }

    def get_financial_summary(self):
        """Profit and loss overview: Revenue vs Expenses vs Payroll."""
        sales_m = self.monthly_sales_df.groupby('year_month')['sales_amount'].sum().reset_index()
        exp_m = self.expenses_df.groupby('year_month')['amount_EGP'].sum().reset_index()
        pay_m = self.payroll_df.groupby('pay_month')['net_paid_EGP'].sum().reset_index().rename(columns={'pay_month': 'year_month'})

        # Merge for 2025 and 2026
        all_months = sorted(list(set(sales_m['year_month']).union(set(exp_m['year_month'])).union(set(pay_m['year_month']))))
        df_fin = pd.DataFrame({'year_month': all_months})
        df_fin = pd.merge(df_fin, sales_m, on='year_month', how='left').fillna(0)
        df_fin = pd.merge(df_fin, exp_m, on='year_month', how='left').fillna(0)
        df_fin = pd.merge(df_fin, pay_m, on='year_month', how='left').fillna(0)

        df_fin['total_expenses'] = df_fin['amount_EGP'] + df_fin['net_paid_EGP']
        df_fin['operating_profit'] = df_fin['sales_amount'] - df_fin['total_expenses']
        df_fin['profit_margin'] = np.where(df_fin['sales_amount'] > 0, (df_fin['operating_profit'] / df_fin['sales_amount']) * 100, 0)
        
        # Filter to last 22 months
        recent_fin = df_fin[df_fin['year_month'] >= '2025-01'].sort_values('year_month').to_dict(orient='records')
        
        # Expense categories breakdown
        exp_by_cat = self.expenses_df[self.expenses_df['year_month'].str.startswith('2026')].groupby('expense_category')['amount_EGP'].sum().reset_index()
        exp_by_cat = exp_by_cat.sort_values('amount_EGP', ascending=False).to_dict(orient='records')

        return {
            "monthly_pnl": recent_fin,
            "expense_categories_2026": exp_by_cat
        }

    def get_customer_insights(self):
        """Customer segmentation, age bands, and regional distribution."""
        segments = self.customers_df['customer_segment'].value_counts().reset_index().to_dict(orient='records')
        age_bands = self.customers_df['age_band'].value_counts().reset_index().to_dict(orient='records')
        govs = self.customers_df['governorate_ar'].value_counts().head(10).reset_index().to_dict(orient='records')
        return {
            "segments": segments,
            "age_bands": age_bands,
            "top_governorates": govs,
            "total_customers": len(self.customers_df)
        }
