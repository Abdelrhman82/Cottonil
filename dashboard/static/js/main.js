/**
 * Cottonil Executive Dashboard & Forecasting Suite
 * Front-end controller, charts (Chart.js), and API interaction
 */

let salesTrendChartInstance = null;
let profitTrendChartInstance = null;
let categoryStockChartInstance = null;
let customerSegmentChartInstance = null;
let forecastOutlookChartInstance = null;
let opexBreakdownChartInstance = null;

// Formatters
function formatEGP(val) {
    if (val === null || val === undefined || isNaN(val)) return '0 EGP';
    return Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' EGP';
}

function formatNumber(val) {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Number(val).toLocaleString('en-US');
}

// Navigation Tab Switcher
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = link.getAttribute('data-target');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(sec => {
                if (sec.id === targetSectionId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });

            // Update top bar title
            const titleEl = document.querySelector('.page-title h2');
            const subTitleEl = document.querySelector('.page-title p');
            if (targetSectionId === 'overview') {
                titleEl.textContent = 'Executive Overview';
                subTitleEl.textContent = 'High-level executive metrics, sales velocity, and company performance';
            } else if (targetSectionId === 'branches') {
                titleEl.textContent = 'Branch Network Performance';
                subTitleEl.textContent = '80 retail branches across Egyptian governorates & performance rankings';
            } else if (targetSectionId === 'inventory') {
                titleEl.textContent = 'Inventory & Supply Health';
                subTitleEl.textContent = 'Stock valuations, category breakdowns, and stockout risk indicators';
            } else if (targetSectionId === 'financials') {
                titleEl.textContent = 'Profits & Operating Expenses';
                subTitleEl.textContent = 'Gross revenue, operating overhead, payroll, and EBITDA operating margins';
            } else if (targetSectionId === 'customers') {
                titleEl.textContent = 'Customer Demographics & Intelligence';
                subTitleEl.textContent = '85,000 customers segmented by loyalty, age brackets, and regional distribution';
            } else if (targetSectionId === 'forecasting') {
                titleEl.textContent = 'Machine Learning Sales Forecasting';
                subTitleEl.textContent = 'SARIMA, XGBoost & baseline multi-horizon projections and what-if simulation';
            }
        });
    });
}

// 1. Overview & Sales Trends
async function loadSalesTrends() {
    try {
        const res = await fetch('/api/sales-trends');
        const data = await res.json();

        const labels = data.map(d => d.year_month);
        const sales = data.map(d => d.sales_amount);
        const orders = data.map(d => d.order_count);

        const ctx = document.getElementById('salesTrendChart').getContext('2d');
        if (salesTrendChartInstance) salesTrendChartInstance.destroy();

        salesTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gross Paid Sales (EGP)',
                        data: sales,
                        borderColor: '#0A3A82',
                        backgroundColor: 'rgba(10, 58, 130, 0.08)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Order Volume',
                        data: orders,
                        borderColor: '#1D6FE9',
                        borderDash: [5, 5],
                        tension: 0.3,
                        borderWidth: 1.8,
                        pointRadius: 0,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return 'Sales: ' + formatEGP(context.raw);
                                }
                                return 'Orders: ' + formatNumber(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        position: 'left',
                        grid: { color: 'rgba(226, 232, 240, 0.8)' },
                        ticks: {
                            callback: function(v) { return (v / 1e6).toFixed(1) + 'M EGP'; }
                        }
                    },
                    y1: {
                        position: 'right',
                        grid: { display: false },
                        ticks: {
                            callback: function(v) { return (v / 1000).toFixed(0) + 'k'; }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error loading sales trends:', err);
    }
}

// 2. Branch Network Performance
async function loadBranches() {
    try {
        const res = await fetch('/api/branches');
        const branches = await res.json();

        // Populate Table
        const tbody = document.getElementById('branchesTableBody');
        tbody.innerHTML = '';

        // Select element for simulation
        const branchSelect = document.getElementById('simBranchSelect');
        if (branchSelect && branchSelect.options.length <= 1) {
            branches.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.branch_id;
                opt.textContent = `${b.branch_id} - ${b.branch_name_ar} (${b.city_ar})`;
                branchSelect.appendChild(opt);
            });
        }

        branches.forEach((b, idx) => {
            const tr = document.createElement('tr');
            
            // Format type badge
            let typeBadgeClass = 'badge-street';
            if (b.retail_location_type && b.retail_location_type.toLowerCase().includes('mall')) {
                typeBadgeClass = 'badge-mall';
            } else if (b.retail_location_type && b.retail_location_type.toLowerCase().includes('outlet')) {
                typeBadgeClass = 'badge-outlet';
            }

            const vsLy = b.vs_ly_pct ? Number(b.vs_ly_pct) : 0;
            const growthClass = vsLy >= 0 ? 'trend-up' : 'trend-down';
            const growthSign = vsLy >= 0 ? '+' : '';

            tr.innerHTML = `
                <td><span class="rank-badge">${idx + 1}</span></td>
                <td><strong>${b.branch_id}</strong></td>
                <td>${b.branch_name_ar}</td>
                <td>${b.governorate_ar}</td>
                <td><span class="badge-pill ${typeBadgeClass}">${b.retail_location_type || 'Standard'}</span></td>
                <td><strong>${formatEGP(b.sales_amount)}</strong></td>
                <td>${formatNumber(b.order_count)}</td>
                <td>${b.forecast ? formatEGP(b.forecast) : '-'}</td>
                <td class="${growthClass}"><strong>${growthSign}${vsLy.toFixed(1)}%</strong></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading branches:', err);
    }
}

// 3. Inventory & Supply Chain
async function loadInventory() {
    try {
        const res = await fetch('/api/inventory');
        const inv = await res.json();

        // Category Doughnut Chart
        const categories = inv.categories.map(c => c.product_category);
        const values = inv.categories.map(c => c.closing_stock_value_EGP);

        const ctx = document.getElementById('categoryStockChart').getContext('2d');
        if (categoryStockChartInstance) categoryStockChartInstance.destroy();

        categoryStockChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#0A3A82', '#1D6FE9', '#38BDF8', '#6366F1', '#818CF8', '#A5B4FC'
                    ],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + formatEGP(context.raw);
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });

        // High Risk Stock Table
        const riskTbody = document.getElementById('riskStockTableBody');
        riskTbody.innerHTML = '';
        inv.high_risk_locations.forEach(item => {
            const tr = document.createElement('tr');
            const score = (Number(item.stockout_risk_score) * 100).toFixed(0);
            tr.innerHTML = `
                <td><strong>${item.stock_location_id}</strong></td>
                <td>${item.stock_location_type}</td>
                <td>${item.product_category}</td>
                <td>${formatNumber(item.closing_units)}</td>
                <td>${formatEGP(item.closing_stock_value_EGP)}</td>
                <td><span class="badge-pill badge-risk-high">${score}% Risk</span></td>
            `;
            riskTbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error loading inventory:', err);
    }
}

// 4. Financials & Operating Margin
async function loadFinancials() {
    try {
        const res = await fetch('/api/financials');
        const fin = await res.json();

        const labels = fin.monthly_pnl.map(d => d.year_month);
        const revenue = fin.monthly_pnl.map(d => d.sales_amount);
        const expenses = fin.monthly_pnl.map(d => d.total_expenses);
        const profit = fin.monthly_pnl.map(d => d.operating_profit);

        const ctx = document.getElementById('profitTrendChart').getContext('2d');
        if (profitTrendChartInstance) profitTrendChartInstance.destroy();

        profitTrendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gross Sales (Revenue)',
                        data: revenue,
                        backgroundColor: '#0A3A82',
                        borderRadius: 4
                    },
                    {
                        label: 'Operating Expenses + Payroll',
                        data: expenses,
                        backgroundColor: '#EF4444',
                        borderRadius: 4
                    },
                    {
                        label: 'Estimated Operating Profit',
                        data: profit,
                        type: 'line',
                        borderColor: '#10B981',
                        backgroundColor: '#10B981',
                        borderWidth: 2.5,
                        pointRadius: 3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatEGP(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        ticks: {
                            callback: function(v) { return (v / 1e6).toFixed(1) + 'M EGP'; }
                        }
                    }
                }
            }
        });

        // Opex Breakdown Doughnut
        const expLabels = fin.expense_categories_2026.map(e => e.expense_category);
        const expValues = fin.expense_categories_2026.map(e => e.amount_EGP);

        const opexCtx = document.getElementById('opexBreakdownChart').getContext('2d');
        if (opexBreakdownChartInstance) opexBreakdownChartInstance.destroy();

        opexBreakdownChartInstance = new Chart(opexCtx, {
            type: 'pie',
            data: {
                labels: expLabels,
                datasets: [{
                    data: expValues,
                    backgroundColor: [
                        '#1D6FE9', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'
                    ],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(c) {
                                return c.label + ': ' + formatEGP(c.raw);
                            }
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error loading financials:', err);
    }
}

// 5. Customers & Demographics
async function loadCustomers() {
    try {
        const res = await fetch('/api/customers');
        const cust = await res.json();

        const segLabels = cust.segments.map(s => s.customer_segment);
        const segCounts = cust.segments.map(s => s.count);

        const ctx = document.getElementById('customerSegmentChart').getContext('2d');
        if (customerSegmentChartInstance) customerSegmentChartInstance.destroy();

        customerSegmentChartInstance = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: segLabels,
                datasets: [{
                    data: segCounts,
                    backgroundColor: [
                        'rgba(10, 58, 130, 0.75)',
                        'rgba(29, 111, 233, 0.75)',
                        'rgba(56, 189, 248, 0.75)',
                        'rgba(99, 102, 241, 0.75)',
                        'rgba(16, 185, 129, 0.75)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } }
                }
            }
        });

        // Top Governorates Table
        const govTbody = document.getElementById('govCustomersTableBody');
        govTbody.innerHTML = '';
        cust.top_governorates.forEach((g, idx) => {
            const tr = document.createElement('tr');
            const pct = ((g.count / cust.total_customers) * 100).toFixed(1);
            tr.innerHTML = `
                <td><span class="rank-badge">${idx + 1}</span></td>
                <td><strong>${g.governorate_ar}</strong></td>
                <td>${formatNumber(g.count)}</td>
                <td><strong>${pct}%</strong></td>
            `;
            govTbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error loading customers:', err);
    }
}

// 6. Machine Learning Forecasting
async function loadForecasting() {
    try {
        // Model Comparison Table
        const compRes = await fetch('/api/forecast/models-comparison');
        const comparisons = await compRes.json();

        const compTbody = document.getElementById('modelComparisonTableBody');
        compTbody.innerHTML = '';
        comparisons.forEach(m => {
            const tr = document.createElement('tr');
            const isWinner = m.model.includes('SARIMA') || m.model.includes('baseline_ma3');
            const badgeClass = isWinner ? 'badge-risk-low' : '';
            tr.innerHTML = `
                <td><strong>${m.model}</strong> ${isWinner ? '<span class="badge-pill badge-risk-low">Selected</span>' : ''}</td>
                <td>${m.split}</td>
                <td>${Number(m.MAE).toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                <td>${Number(m.RMSE).toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                <td>${Number(m.MAPE).toFixed(2)}%</td>
                <td><strong>${Number(m.WAPE).toFixed(2)}%</strong></td>
            `;
            compTbody.appendChild(tr);
        });

        // Load 6-month SARIMA forecast
        runCompanyForecast(6);

    } catch (err) {
        console.error('Error loading forecasting models:', err);
    }
}

async function runCompanyForecast(horizon = 6) {
    try {
        const res = await fetch(`/api/forecast/company?horizon=${horizon}`);
        const data = await res.json();

        const labels = data.forecasts.map(f => f.month);
        const values = data.forecasts.map(f => f.forecast_EGP);
        const lowerCi = data.forecasts.map(f => f.lower_ci_EGP);
        const upperCi = data.forecasts.map(f => f.upper_ci_EGP);

        const ctx = document.getElementById('forecastOutlookChart').getContext('2d');
        if (forecastOutlookChartInstance) forecastOutlookChartInstance.destroy();

        forecastOutlookChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'SARIMA Projected Sales (EGP)',
                        data: values,
                        borderColor: '#0A3A82',
                        backgroundColor: 'rgba(10, 58, 130, 0.1)',
                        fill: false,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    },
                    {
                        label: '90% Upper Bound',
                        data: upperCi,
                        borderColor: 'rgba(29, 111, 233, 0.4)',
                        borderDash: [4, 4],
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        label: '90% Lower Bound',
                        data: lowerCi,
                        borderColor: 'rgba(29, 111, 233, 0.4)',
                        borderDash: [4, 4],
                        fill: '-1',
                        backgroundColor: 'rgba(29, 111, 233, 0.08)',
                        tension: 0.3,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 } } },
                    tooltip: {
                        callbacks: {
                            label: function(c) {
                                return c.dataset.label + ': ' + formatEGP(c.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(v) { return (v / 1e6).toFixed(1) + 'M EGP'; }
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error running company forecast:', err);
    }
}

// Interactive Scenario Simulation
async function simulateScenario() {
    const branchId = document.getElementById('simBranchSelect').value;
    const growthPct = parseFloat(document.getElementById('simGrowthInput').value) || 0;
    const resBox = document.getElementById('simResultBox');

    if (!branchId) {
        alert('Please select a branch first.');
        return;
    }

    try {
        const res = await fetch(`/api/forecast/simulate?branch_id=${branchId}&growth_pct=${growthPct}`);
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        resBox.style.display = 'block';
        resBox.innerHTML = `
            <div style="background: #FFFFFF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 18px; margin-top: 10px;">
                <h4 style="color: #0A3A82; margin-bottom: 8px; font-size: 15px;">
                    <i class="fas fa-check-circle"></i> Simulation Result: ${data.branch_id} for ${data.forecast_month}
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div>
                        <div style="font-size: 11px; color: #64748B;">ML Base Forecast:</div>
                        <div style="font-size: 16px; font-weight: 700; color: #1E293B;">${formatEGP(data.base_forecast_EGP)}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #64748B;">Applied Scenario Growth:</div>
                        <div style="font-size: 16px; font-weight: 700; color: ${data.scenario_growth_pct >= 0 ? '#10B981' : '#EF4444'};">
                            ${data.scenario_growth_pct >= 0 ? '+' : ''}${data.scenario_growth_pct}%
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #64748B;">Adjusted Expected Target:</div>
                        <div style="font-size: 18px; font-weight: 800; color: #0A3A82;">${formatEGP(data.adjusted_forecast_EGP)}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #64748B;">Model Engine:</div>
                        <div style="font-size: 14px; font-weight: 600; color: #64748B;">${data.method}</div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error simulating scenario:', err);
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadSalesTrends();
    loadBranches();
    loadInventory();
    loadFinancials();
    loadCustomers();
    loadForecasting();

    // Event listeners
    const horizonSelect = document.getElementById('horizonSelect');
    if (horizonSelect) {
        horizonSelect.addEventListener('change', (e) => {
            runCompanyForecast(parseInt(e.target.value));
        });
    }

    const simBtn = document.getElementById('runSimBtn');
    if (simBtn) {
        simBtn.addEventListener('click', simulateScenario);
    }
});

