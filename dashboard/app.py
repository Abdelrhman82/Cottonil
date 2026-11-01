"""
FastAPI Application for Cottonil Executive Dashboard & Forecasting Suite.
Serves interactive dashboard frontend and analytical API endpoints.
"""
import os
from fastapi import FastAPI, Request, Query
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from dashboard.data_service import DashboardDataService
from dashboard.forecast_service import ForecastService

app = FastAPI(
    title="Cottonil Executive Analytics & Forecasting Dashboard",
    description="Unified senior management executive portal for Cottonil Egypt",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Initialize data and model services
data_service = DashboardDataService()
forecast_service = ForecastService()


@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    """Render the primary executive dashboard."""
    kpis = data_service.get_kpis()
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "kpis": kpis,
            "title": "Cottonil Executive Dashboard"
        }
    )


# ---------------- API ENDPOINTS ---------------- #

@app.get("/api/kpis")
async def get_kpis():
    """Returns top executive level KPIs."""
    return data_service.get_kpis()


@app.get("/api/sales-trends")
async def get_sales_trends():
    """Returns monthly historical sales aggregated for trend charts."""
    return data_service.get_sales_trends()


@app.get("/api/branches")
async def get_branches():
    """Returns branch level metrics, rankings and predictive outlook."""
    return data_service.get_branch_performance()


@app.get("/api/inventory")
async def get_inventory():
    """Returns inventory status, categories, values and stockout risks."""
    return data_service.get_inventory_summary()


@app.get("/api/financials")
async def get_financials():
    """Returns revenue, operating expenses, payroll, and profit margins."""
    return data_service.get_financial_summary()


@app.get("/api/customers")
async def get_customers():
    """Returns customer segmentations, age bands, and geographical distribution."""
    return data_service.get_customer_insights()


@app.get("/api/forecast/company")
async def get_company_forecast(horizon: int = Query(6, ge=1, le=24)):
    """Runs interactive SARIMA / company forecast for horizon months."""
    return forecast_service.run_company_forecast(horizon_months=horizon)


@app.get("/api/forecast/outlook")
async def get_forecast_outlook(branch_id: str = Query("ALL")):
    """Returns next-month forecasts for company or a specific branch."""
    return forecast_service.get_next_month_outlook(branch_id=branch_id)


@app.get("/api/forecast/models-comparison")
async def get_models_comparison():
    """Returns comparative validation & test metrics for ML models."""
    return forecast_service.get_model_comparison()


@app.get("/api/forecast/simulate")
async def simulate_branch_scenario(branch_id: str, growth_pct: float = Query(0.0)):
    """Simulate what-if growth on top of the machine learning forecast."""
    return forecast_service.run_branch_simulation(branch_id=branch_id, growth_scenario_pct=growth_pct)

