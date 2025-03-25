/**
 * Portfolio management functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize portfolio if on portfolio page
    if (document.getElementById('portfolio-summary')) {
        initializePortfolio();
    }
    
    // Add event listeners for portfolio management
    const addAssetForm = document.getElementById('add-asset-form');
    if (addAssetForm) {
        addAssetForm.addEventListener('submit', handleAddAsset);
    }
    
    const assetSearch = document.getElementById('asset-search');
    if (assetSearch) {
        assetSearch.addEventListener('input', debounce(handleAssetSearch, 500));
    }
});

// Initialize portfolio data and charts
function initializePortfolio() {
    const portfolioId = document.getElementById('portfolio-data')?.dataset.portfolioId;
    
    if (!portfolioId) return;
    
    // Load portfolio data
    fetchPortfolioData(portfolioId);
    
    // Load transaction history
    fetchTransactionHistory(portfolioId);
    
    // Setup allocation chart if element exists
    const allocationChartEl = document.getElementById('allocation-chart');
    if (allocationChartEl) {
        setupAllocationChart(portfolioId);
    }
    
    // Setup performance chart if element exists
    const performanceChartEl = document.getElementById('performance-chart');
    if (performanceChartEl) {
        setupPerformanceChart(portfolioId);
    }
}

// Fetch portfolio data from the server
function fetchPortfolioData(portfolioId) {
    const portfolioSummary = document.getElementById('portfolio-summary');
    const assetsList = document.getElementById('assets-list');
    
    if (!portfolioSummary || !assetsList) return;
    
    // Show loading state
    portfolioSummary.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    assetsList.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Fetch portfolio data
    // In this demo, we'll use the data from the page itself
    const portfolioData = JSON.parse(document.getElementById('portfolio-data')?.dataset.portfolio || '{}');
    const assets = JSON.parse(document.getElementById('portfolio-data')?.dataset.assets || '[]');
    
    // If we have no data, show empty state
    if (!portfolioData || Object.keys(portfolioData).length === 0) {
        portfolioSummary.innerHTML = '<div class="alert alert-info">No portfolio data available</div>';
        assetsList.innerHTML = '<div class="alert alert-info">No assets found in this portfolio</div>';
        return;
    }
    
    // Calculate portfolio value and other metrics
    let totalValue = 0;
    let totalCost = 0;
    
    // Update market values for each asset
    updateAssetMarketValues(assets).then(updatedAssets => {
        // Calculate totals
        updatedAssets.forEach(asset => {
            totalValue += asset.marketValue || 0;
            totalCost += asset.quantity * asset.purchase_price;
        });
        
        // Update portfolio summary
        const totalReturn = totalValue - totalCost;
        const returnPercentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
        
        portfolioSummary.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">${getTranslation('Portfolio Summary')}</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>${getTranslation('Total Value')}:</span>
                                <span class="fw-bold">${formatCurrency(totalValue)}</span>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>${getTranslation('Total Cost')}:</span>
                                <span class="fw-bold">${formatCurrency(totalCost)}</span>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>${getTranslation('Total Return')}:</span>
                                <span class="fw-bold ${totalReturn >= 0 ? 'text-success' : 'text-danger'}">
                                    ${formatCurrency(totalReturn)} (${returnPercentage.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>${getTranslation('Asset Count')}:</span>
                                <span class="fw-bold">${updatedAssets.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Update assets list
        if (updatedAssets.length === 0) {
            assetsList.innerHTML = `<div class="alert alert-info">${getTranslation('No assets found in this portfolio')}</div>`;
        } else {
            let assetsHtml = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>${getTranslation('Symbol')}</th>
                                <th>${getTranslation('Name')}</th>
                                <th>${getTranslation('Type')}</th>
                                <th>${getTranslation('Quantity')}</th>
                                <th>${getTranslation('Purchase Price')}</th>
                                <th>${getTranslation('Current Price')}</th>
                                <th>${getTranslation('Market Value')}</th>
                                <th>${getTranslation('Return')}</th>
                                <th>${getTranslation('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            updatedAssets.forEach(asset => {
                const assetReturn = (asset.marketValue || 0) - (asset.quantity * asset.purchase_price);
                const returnPct = asset.purchase_price > 0 ? (assetReturn / (asset.quantity * asset.purchase_price)) * 100 : 0;
                
                assetsHtml += `
                    <tr>
                        <td>${asset.symbol}</td>
                        <td>${asset.name}</td>
                        <td>${getTranslation(asset.asset_type)}</td>
                        <td>${asset.quantity.toFixed(asset.asset_type === 'crypto' ? 6 : 2)}</td>
                        <td>${formatCurrency(asset.purchase_price)}</td>
                        <td>${formatCurrency(asset.currentPrice || 0)}</td>
                        <td>${formatCurrency(asset.marketValue || 0)}</td>
                        <td class="${assetReturn >= 0 ? 'text-success' : 'text-danger'}">
                            ${formatCurrency(assetReturn)} (${returnPct.toFixed(2)}%)
                        </td>
                        <td>
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-outline-primary view-asset-btn" 
                                        data-asset-id="${asset.id}" data-asset-symbol="${asset.symbol}">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-danger sell-asset-btn" 
                                        data-bs-toggle="modal" data-bs-target="#sellAssetModal"
                                        data-asset-id="${asset.id}" data-asset-symbol="${asset.symbol}" 
                                        data-asset-name="${asset.name}" data-asset-quantity="${asset.quantity}"
                                        data-asset-price="${asset.currentPrice || 0}">
                                    <i class="bi bi-currency-exchange"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            assetsHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            assetsList.innerHTML = assetsHtml;
            
            // Add event listeners to the view and sell buttons
            document.querySelectorAll('.view-asset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const symbol = btn.dataset.assetSymbol;
                    window.location.href = `/market-data?symbol=${symbol}`;
                });
            });
            
            document.querySelectorAll('.sell-asset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const assetId = btn.dataset.assetId;
                    const symbol = btn.dataset.assetSymbol;
                    const name = btn.dataset.assetName;
                    const quantity = btn.dataset.assetQuantity;
                    const price = btn.dataset.assetPrice;
                    
                    // Update the sell modal with asset details
                    document.getElementById('sell-asset-id').value = assetId;
                    document.getElementById('sell-asset-symbol').value = symbol;
                    document.getElementById('sell-asset-name').textContent = name;
                    document.getElementById('sell-max-quantity').textContent = quantity;
                    document.getElementById('sell-current-price').textContent = formatCurrency(price);
                    document.getElementById('sell-quantity').value = '';
                    document.getElementById('sell-quantity').max = quantity;
                    document.getElementById('sell-price').value = price;
                    
                    // Clear previous calculations
                    document.getElementById('sell-total-value').textContent = formatCurrency(0);
                });
            });
        }
        
        // Update allocation chart if it exists
        updateAllocationChart(updatedAssets);
    });
}

// Update market values for each asset
async function updateAssetMarketValues(assets) {
    const updatedAssets = [...assets];
    
    // Process assets in batches to avoid too many parallel requests
    const batchSize = 5;
    const batches = Math.ceil(updatedAssets.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, updatedAssets.length);
        const batch = updatedAssets.slice(start, end);
        
        await Promise.all(batch.map(async (asset) => {
            try {
                // Get current price based on asset type
                let data;
                if (asset.asset_type === 'stock') {
                    data = await fetch(`/api/stock/${asset.symbol}`).then(r => r.json());
                } else if (asset.asset_type === 'crypto') {
                    data = await fetch(`/api/crypto/${asset.symbol}`).then(r => r.json());
                }
                
                if (data && !data.error) {
                    asset.currentPrice = data.price;
                    asset.marketValue = asset.quantity * data.price;
                } else {
                    // If there's an error, use purchase price as fallback
                    asset.currentPrice = asset.purchase_price;
                    asset.marketValue = asset.quantity * asset.purchase_price;
                }
            } catch (error) {
                console.error(`Error updating market value for ${asset.symbol}:`, error);
                // Use purchase price as fallback
                asset.currentPrice = asset.purchase_price;
                asset.marketValue = asset.quantity * asset.purchase_price;
            }
        }));
    }
    
    return updatedAssets;
}

// Setup the portfolio allocation chart
function setupAllocationChart(portfolioId) {
    const allocationChartEl = document.getElementById('allocation-chart');
    if (!allocationChartEl) return;
    
    // Get assets from the page data
    const assets = JSON.parse(document.getElementById('portfolio-data')?.dataset.assets || '[]');
    
    // Show loading state
    allocationChartEl.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    
    // Update asset market values and then create the chart
    updateAssetMarketValues(assets).then(updatedAssets => {
        updateAllocationChart(updatedAssets);
    });
}

// Update the allocation chart with new data
function updateAllocationChart(assets) {
    const allocationChartEl = document.getElementById('allocation-chart');
    if (!allocationChartEl) return;
    
    // Clear loading state
    allocationChartEl.innerHTML = '<canvas id="allocation-chart-canvas" height="300"></canvas>';
    
    // Group assets by type and calculate total values
    const assetTypes = {};
    assets.forEach(asset => {
        const type = asset.asset_type;
        if (!assetTypes[type]) {
            assetTypes[type] = 0;
        }
        assetTypes[type] += asset.marketValue || 0;
    });
    
    // Prepare data for the chart
    const labels = Object.keys(assetTypes).map(type => getTranslation(type));
    const data = Object.values(assetTypes);
    
    // Create the chart
    createAllocationChart('allocation-chart-canvas', labels, data);
}

// Fetch transaction history
function fetchTransactionHistory(portfolioId) {
    const transactionHistory = document.getElementById('transaction-history');
    if (!transactionHistory) return;
    
    // Show loading state
    transactionHistory.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Fetch transaction history
    fetch(`/api/portfolio/${portfolioId}/transactions`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                transactionHistory.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }
            
            if (data.length === 0) {
                transactionHistory.innerHTML = `<div class="alert alert-info">${getTranslation('No transactions found')}</div>`;
                return;
            }
            
            let transactionsHtml = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>${getTranslation('Date')}</th>
                                <th>${getTranslation('Symbol')}</th>
                                <th>${getTranslation('Type')}</th>
                                <th>${getTranslation('Quantity')}</th>
                                <th>${getTranslation('Price')}</th>
                                <th>${getTranslation('Total')}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.forEach(transaction => {
                transactionsHtml += `
                    <tr>
                        <td>${new Date(transaction.timestamp).toLocaleString()}</td>
                        <td>${transaction.symbol}</td>
                        <td>${getTranslation(transaction.type)}</td>
                        <td>${transaction.quantity.toFixed(6)}</td>
                        <td>${formatCurrency(transaction.price)}</td>
                        <td>${formatCurrency(transaction.total_amount)}</td>
                    </tr>
                `;
            });
            
            transactionsHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            transactionHistory.innerHTML = transactionsHtml;
        })
        .catch(error => {
            console.error('Error fetching transaction history:', error);
            transactionHistory.innerHTML = `<div class="alert alert-danger">${getTranslation('Failed to load transaction history')}</div>`;
        });
}

// Handle add asset form submission
function handleAddAsset(e) {
    e.preventDefault();
    
    const form = e.target;
    const portfolioId = form.querySelector('#portfolio-id').value;
    const symbol = form.querySelector('#asset-symbol').value;
    const name = form.querySelector('#asset-name').value;
    const type = form.querySelector('#asset-type').value;
    const quantity = parseFloat(form.querySelector('#asset-quantity').value);
    const purchasePrice = parseFloat(form.querySelector('#asset-price').value);
    
    // Validate inputs
    if (!symbol || !name || !type || isNaN(quantity) || isNaN(purchasePrice) || quantity <= 0 || purchasePrice <= 0) {
        showAlert('danger', getTranslation('Please fill in all fields with valid values'));
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${getTranslation('Adding...')}`;
    
    // Submit data to server
    fetch(`/api/portfolio/${portfolioId}/add-asset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            symbol,
            name,
            type,
            quantity,
            purchase_price: purchasePrice
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset loading state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        if (data.error) {
            showAlert('danger', data.error);
            return;
        }
        
        // Show success message
        showAlert('success', getTranslation('Asset added successfully'));
        
        // Reset form and close modal
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('addAssetModal')).hide();
        
        // Refresh portfolio data
        fetchPortfolioData(portfolioId);
    })
    .catch(error => {
        console.error('Error adding asset:', error);
        showAlert('danger', getTranslation('Failed to add asset'));
        
        // Reset loading state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

// Handle asset search
function handleAssetSearch(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('asset-search-results');
    
    if (!resultsContainer) return;
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Show loading indicator
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Search for assets
    fetch(`/api/search-assets?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultsContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }
            
            if (!data.results || data.results.length === 0) {
                resultsContainer.innerHTML = `<div class="alert alert-info">${getTranslation('No results found')}</div>`;
                return;
            }
            
            let resultsHtml = '<div class="list-group">';
            
            data.results.forEach(result => {
                resultsHtml += `
                    <button type="button" class="list-group-item list-group-item-action asset-search-result"
                            data-symbol="${result.symbol}" data-name="${result.name}" data-type="${result.type}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${result.symbol}</strong> - ${result.name}
                            </div>
                            <span class="badge bg-secondary">${getTranslation(result.type)}</span>
                        </div>
                    </button>
                `;
            });
            
            resultsHtml += '</div>';
            resultsContainer.innerHTML = resultsHtml;
            
            // Add event listeners to search results
            document.querySelectorAll('.asset-search-result').forEach(result => {
                result.addEventListener('click', () => {
                    const symbol = result.dataset.symbol;
                    const name = result.dataset.name;
                    const type = result.dataset.type;
                    
                    // Fill the form fields
                    document.getElementById('asset-symbol').value = symbol;
                    document.getElementById('asset-name').value = name;
                    document.getElementById('asset-type').value = type;
                    
                    // Try to get current price
                    getAssetPrice(symbol, type);
                    
                    // Clear search results
                    resultsContainer.innerHTML = '';
                    e.target.value = '';
                });
            });
        })
        .catch(error => {
            console.error('Error searching assets:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger">${getTranslation('Failed to search assets')}</div>`;
        });
}

// Get asset price for the form
function getAssetPrice(symbol, type) {
    const priceField = document.getElementById('asset-price');
    const priceSpinner = document.getElementById('price-spinner');
    
    if (!priceField || !priceSpinner) return;
    
    // Show loading indicator
    priceSpinner.classList.remove('d-none');
    
    // Get price from API
    const endpoint = type === 'stock' ? `/api/stock/${symbol}` : `/api/crypto/${symbol}`;
    
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            priceSpinner.classList.add('d-none');
            
            if (data.error) {
                console.error('Error getting price:', data.error);
                return;
            }
            
            // Set the price field
            priceField.value = data.price;
        })
        .catch(error => {
            console.error('Error getting asset price:', error);
            priceSpinner.classList.add('d-none');
        });
}

// Helper function to show alerts
function showAlert(type, message) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.role = 'alert';
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertsContainer.appendChild(alertElement);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertsContainer.removeChild(alertElement);
        }, 150);
    }, 5000);
}

// Helper function to debounce inputs
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
