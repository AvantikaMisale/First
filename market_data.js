/**
 * Market data functionality for stocks and cryptocurrencies
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize market data if on market data page
    if (document.getElementById('market-data-container')) {
        initializeMarketData();
    }
    
    // Add event listener for asset search
    const marketSearchForm = document.getElementById('market-search-form');
    if (marketSearchForm) {
        marketSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const symbol = document.getElementById('market-search-input').value.trim().toUpperCase();
            if (symbol) {
                loadAssetData(symbol);
            }
        });
    }
    
    // Initialize market summary on dashboard
    if (document.getElementById('market-summary')) {
        loadMarketSummary();
    }
});

// Initialize market data
function initializeMarketData() {
    // Check if there's a symbol in the URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    
    if (symbol) {
        // Load data for the specified symbol
        loadAssetData(symbol);
    } else {
        // Load default market overview
        loadMarketOverview();
    }
}

// Load asset data (stock or crypto)
function loadAssetData(symbol) {
    const assetDataContainer = document.getElementById('asset-data');
    const chartContainer = document.getElementById('asset-chart');
    const newsContainer = document.getElementById('asset-news');
    
    if (!assetDataContainer || !chartContainer) return;
    
    // Update URL without reloading the page
    const url = new URL(window.location);
    url.searchParams.set('symbol', symbol);
    window.history.pushState({}, '', url);
    
    // Show loading indicators
    assetDataContainer.innerHTML = '<div class="text-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    chartContainer.innerHTML = '<div class="text-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    if (newsContainer) {
        newsContainer.innerHTML = '<div class="text-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    }
    
    // First try to get stock data
    fetch(`/api/stock/${symbol}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // If stock API fails, try crypto
                return fetch(`/api/crypto/${symbol}`)
                    .then(response => response.json())
                    .then(cryptoData => {
                        if (cryptoData.error) {
                            throw new Error(`No data found for symbol: ${symbol}`);
                        }
                        return { data: cryptoData, type: 'crypto' };
                    });
            }
            return { data, type: 'stock' };
        })
        .then(result => {
            const { data, type } = result;
            
            // Display asset data
            displayAssetData(data, type);
            
            // Display asset chart
            displayAssetChart(data);
            
            // Load news for the asset
            if (newsContainer) {
                loadAssetNews(symbol);
            }
        })
        .catch(error => {
            console.error('Error loading asset data:', error);
            assetDataContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">${getTranslation('Data Not Found')}</h4>
                    <p>${getTranslation('Could not find data for symbol')}: ${symbol}</p>
                    <hr>
                    <p class="mb-0">${getTranslation('Please check the symbol and try again')}</p>
                </div>
            `;
            chartContainer.innerHTML = '';
            if (newsContainer) {
                newsContainer.innerHTML = '';
            }
        });
}

// Display asset data in the UI
function displayAssetData(data, assetType) {
    const assetDataContainer = document.getElementById('asset-data');
    if (!assetDataContainer) return;
    
    // Format the price change for display
    const priceChangeClass = data.change >= 0 ? 'text-success' : 'text-danger';
    const priceChangeIcon = data.change >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
    
    // Different display based on asset type
    if (assetType === 'stock') {
        assetDataContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="card-title mb-0">
                            ${data.name} (${data.symbol})
                            <span class="badge bg-primary ms-2">${getTranslation('Stock')}</span>
                        </h2>
                        <button id="add-to-portfolio-btn" class="btn btn-outline-primary">
                            <i class="bi bi-plus-circle"></i> ${getTranslation('Add to Portfolio')}
                        </button>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h3 class="mb-0">${formatCurrency(data.price)}</h3>
                            <div class="${priceChangeClass}">
                                <i class="bi ${priceChangeIcon}"></i>
                                ${formatCurrency(data.change)} (${data.change_percent}%)
                            </div>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <div class="text-muted">${getTranslation('Market Cap')}: ${formatLargeNumber(data.market_cap)}</div>
                            <div class="text-muted">${getTranslation('P/E Ratio')}: ${data.pe_ratio || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-2">
                                <strong>${getTranslation('Sector')}:</strong> ${data.sector || 'N/A'}
                            </div>
                            <div class="mb-2">
                                <strong>${getTranslation('Industry')}:</strong> ${data.industry || 'N/A'}
                            </div>
                            <div class="mb-2">
                                <strong>${getTranslation('Dividend Yield')}:</strong> ${data.dividend_yield ? data.dividend_yield + '%' : 'N/A'}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <button id="analyze-sentiment-btn" class="btn btn-sm btn-outline-secondary mb-2">
                                <i class="bi bi-graph-up"></i> ${getTranslation('Analyze Market Sentiment')}
                            </button>
                            <button id="get-ai-insights-btn" class="btn btn-sm btn-outline-secondary">
                                <i class="bi bi-lightbulb"></i> ${getTranslation('Get AI Insights')}
                            </button>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <div class="asset-description">
                        <h5>${getTranslation('Company Description')}</h5>
                        <p>${data.description || getTranslation('No description available')}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Crypto display
        assetDataContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="card-title mb-0">
                            ${data.name} (${data.symbol})
                            <span class="badge bg-warning text-dark ms-2">${getTranslation('Cryptocurrency')}</span>
                        </h2>
                        <button id="add-to-portfolio-btn" class="btn btn-outline-primary">
                            <i class="bi bi-plus-circle"></i> ${getTranslation('Add to Portfolio')}
                        </button>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h3 class="mb-0">${formatCurrency(data.price)}</h3>
                            <div class="${priceChangeClass}">
                                <i class="bi ${priceChangeIcon}"></i>
                                ${formatCurrency(data.change)} (${data.change_percent}%)
                            </div>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <div class="text-muted">${getTranslation('Market Cap')}: ${formatLargeNumber(data.market_cap)}</div>
                            ${data.note ? `<div class="text-muted small"><i class="bi bi-info-circle"></i> ${data.note}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-2">
                                <strong>${getTranslation('Type')}:</strong> ${getTranslation('Cryptocurrency')}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <button id="analyze-sentiment-btn" class="btn btn-sm btn-outline-secondary mb-2">
                                <i class="bi bi-graph-up"></i> ${getTranslation('Analyze Market Sentiment')}
                            </button>
                            <button id="get-ai-insights-btn" class="btn btn-sm btn-outline-secondary">
                                <i class="bi bi-lightbulb"></i> ${getTranslation('Get AI Insights')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add event listeners for buttons
    document.getElementById('add-to-portfolio-btn')?.addEventListener('click', () => {
        // Show the modal for adding to portfolio
        const modal = new bootstrap.Modal(document.getElementById('addAssetModal'));
        
        // Pre-fill the form with asset data
        document.getElementById('asset-symbol').value = data.symbol;
        document.getElementById('asset-name').value = data.name;
        document.getElementById('asset-type').value = assetType;
        document.getElementById('asset-price').value = data.price;
        
        modal.show();
    });
    
    document.getElementById('analyze-sentiment-btn')?.addEventListener('click', () => {
        analyzeSentiment(data.symbol);
    });
    
    document.getElementById('get-ai-insights-btn')?.addEventListener('click', () => {
        getAIInsights(data.symbol, data.name, assetType);
    });
}

// Display asset chart
function displayAssetChart(data) {
    const chartContainer = document.getElementById('asset-chart');
    if (!chartContainer) return;
    
    // Prepare chart container
    chartContainer.innerHTML = '<canvas id="price-chart" height="400"></canvas>';
    
    // Create chart
    const chartData = data.chart_data;
    if (chartData && chartData.dates && chartData.prices) {
        createPriceChart('price-chart', chartData.dates, chartData.prices);
    } else {
        chartContainer.innerHTML = `<div class="alert alert-info">${getTranslation('No chart data available')}</div>`;
    }
}

// Load market overview
function loadMarketOverview() {
    const marketDataContainer = document.getElementById('market-data-container');
    if (!marketDataContainer) return;
    
    // Show loading indicator
    marketDataContainer.innerHTML = '<div class="text-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Load market summary
    fetch('/api/market-summary')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Build the market overview UI
            const marketSummary = data.market_summary || {};
            
            let overviewHtml = `
                <h2 class="mb-4">${getTranslation('Market Overview')}</h2>
                
                <div class="row">
                    <div class="col-md-8">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">${getTranslation('Market Indices')}</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>${getTranslation('Symbol')}</th>
                                                <th>${getTranslation('Name')}</th>
                                                <th>${getTranslation('Price')}</th>
                                                <th>${getTranslation('Change')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;
            
            // Add indices to the table
            const indices = ['SPY', 'QQQ', 'DIA', 'IWM'];
            indices.forEach(symbol => {
                if (marketSummary[symbol]) {
                    const data = marketSummary[symbol];
                    const changeClass = data.change_percent >= 0 ? 'text-success' : 'text-danger';
                    const changeIcon = data.change_percent >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
                    
                    overviewHtml += `
                        <tr class="cursor-pointer" onclick="loadAssetData('${symbol}')">
                            <td>${symbol}</td>
                            <td>${data.name}</td>
                            <td>${formatCurrency(data.price)}</td>
                            <td class="${changeClass}">
                                <i class="bi ${changeIcon}"></i>
                                ${data.change_percent}%
                            </td>
                        </tr>
                    `;
                }
            });
            
            overviewHtml += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">${getTranslation('Cryptocurrencies')}</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>${getTranslation('Symbol')}</th>
                                                <th>${getTranslation('Name')}</th>
                                                <th>${getTranslation('Price')}</th>
                                                <th>${getTranslation('Change')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;
            
            // Add cryptocurrencies to the table
            const cryptos = ['BTC', 'ETH'];
            cryptos.forEach(symbol => {
                if (marketSummary[symbol]) {
                    const data = marketSummary[symbol];
                    const changeClass = data.change_percent >= 0 ? 'text-success' : 'text-danger';
                    const changeIcon = data.change_percent >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
                    
                    overviewHtml += `
                        <tr class="cursor-pointer" onclick="loadAssetData('${symbol}')">
                            <td>${symbol}</td>
                            <td>${data.name}</td>
                            <td>${formatCurrency(data.price)}</td>
                            <td class="${changeClass}">
                                <i class="bi ${changeIcon}"></i>
                                ${data.change_percent}%
                            </td>
                        </tr>
                    `;
                }
            });
            
            overviewHtml += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">${getTranslation('Search Assets')}</h5>
                            </div>
                            <div class="card-body">
                                <form id="market-search-form">
                                    <div class="input-group mb-3">
                                        <input type="text" id="market-search-input" class="form-control" 
                                               placeholder="${getTranslation('Enter stock or crypto symbol')}" required>
                                        <button class="btn btn-primary" type="submit">
                                            <i class="bi bi-search"></i>
                                        </button>
                                    </div>
                                </form>
                                
                                <div class="mt-3">
                                    <h6>${getTranslation('Popular Stocks')}</h6>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="AAPL">AAPL</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="MSFT">MSFT</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="GOOGL">GOOGL</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="AMZN">AMZN</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="TSLA">TSLA</button>
                                    </div>
                                </div>
                                
                                <div class="mt-3">
                                    <h6>${getTranslation('Popular Cryptocurrencies')}</h6>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="BTC">BTC</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="ETH">ETH</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="SOL">SOL</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="ADA">ADA</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary popular-asset" data-symbol="DOGE">DOGE</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">${getTranslation('AI Assistant')}</h5>
                            </div>
                            <div class="card-body">
                                <p>${getTranslation('Ask our AI assistant about market trends, investment strategies, or specific assets.')}</p>
                                
                                <div class="d-grid">
                                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#chatModal">
                                        <i class="bi bi-chat-dots"></i> ${getTranslation('Chat with Assistant')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Update the market data container
            marketDataContainer.innerHTML = overviewHtml;
            
            // Add event listeners to popular asset buttons
            document.querySelectorAll('.popular-asset').forEach(button => {
                button.addEventListener('click', () => {
                    const symbol = button.dataset.symbol;
                    loadAssetData(symbol);
                });
            });
            
            // Add event listener for market search form
            document.getElementById('market-search-form')?.addEventListener('submit', function(e) {
                e.preventDefault();
                const symbol = document.getElementById('market-search-input').value.trim().toUpperCase();
                if (symbol) {
                    loadAssetData(symbol);
                }
            });
        })
        .catch(error => {
            console.error('Error loading market overview:', error);
            marketDataContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">${getTranslation('Error Loading Market Data')}</h4>
                    <p>${error.message || getTranslation('Failed to load market overview')}</p>
                </div>
            `;
        });
}

// Load news for a specific asset
function loadAssetNews(symbol) {
    const newsContainer = document.getElementById('asset-news');
    if (!newsContainer) return;
    
    // Show loading indicator
    newsContainer.innerHTML = '<div class="text-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Fetch news for the asset
    fetch(`/api/news/${symbol}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            const news = data.news || [];
            
            if (news.length === 0) {
                newsContainer.innerHTML = `<div class="alert alert-info">${getTranslation('No news found for')} ${symbol}</div>`;
                return;
            }
            
            let newsHtml = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">${getTranslation('Latest News for')} ${symbol}</h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group">
            `;
            
            news.forEach(item => {
                // Format the date
                const date = new Date(item.time_published);
                const formattedDate = date.toLocaleDateString();
                
                // Determine sentiment class
                let sentimentClass = 'bg-secondary';
                let sentimentLabel = getTranslation('Neutral');
                
                if (item.sentiment > 0.2) {
                    sentimentClass = 'bg-success';
                    sentimentLabel = getTranslation('Positive');
                } else if (item.sentiment < -0.2) {
                    sentimentClass = 'bg-danger';
                    sentimentLabel = getTranslation('Negative');
                }
                
                newsHtml += `
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="list-group-item list-group-item-action">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-1">${item.title}</h6>
                            <span class="badge ${sentimentClass} rounded-pill">${sentimentLabel}</span>
                        </div>
                        <p class="mb-1 text-truncate">${item.summary}</p>
                        <small class="text-muted">
                            ${item.source} - ${formattedDate}
                        </small>
                    </a>
                `;
            });
            
            newsHtml += `
                        </div>
                    </div>
                </div>
            `;
            
            newsContainer.innerHTML = newsHtml;
        })
        .catch(error => {
            console.error('Error loading news:', error);
            newsContainer.innerHTML = `<div class="alert alert-info">${getTranslation('Could not load news for')} ${symbol}</div>`;
        });
}

// Load market summary for dashboard
function loadMarketSummary() {
    const marketSummaryContainer = document.getElementById('market-summary');
    if (!marketSummaryContainer) return;
    
    // Show loading indicator
    marketSummaryContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Fetch market summary
    fetch('/api/market-summary')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            const marketSummary = data.market_summary || {};
            
            // Build a compact market summary
            let summaryHtml = `
                <div class="d-flex flex-wrap justify-content-between">
            `;
            
            // Add market indices
            ['SPY', 'BTC'].forEach(symbol => {
                if (marketSummary[symbol]) {
                    const data = marketSummary[symbol];
                    const changeClass = data.change_percent >= 0 ? 'text-success' : 'text-danger';
                    const changeIcon = data.change_percent >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
                    
                    summaryHtml += `
                        <div class="me-3 mb-2">
                            <div class="small text-muted">${data.name}</div>
                            <div class="d-flex align-items-center">
                                <span class="h6 mb-0 me-2">${formatCurrency(data.price)}</span>
                                <span class="${changeClass} small">
                                    <i class="bi ${changeIcon}"></i> ${data.change_percent}%
                                </span>
                            </div>
                        </div>
                    `;
                }
            });
            
            summaryHtml += `
                </div>
            `;
            
            // Update the market summary container
            marketSummaryContainer.innerHTML = summaryHtml;
        })
        .catch(error => {
            console.error('Error loading market summary:', error);
            marketSummaryContainer.innerHTML = `<div class="small text-muted">${getTranslation('Market data unavailable')}</div>`;
        });
}

// Analyze market sentiment for an asset
function analyzeSentiment(symbol) {
    // Create a modal to display the sentiment analysis
    const modalId = 'sentimentModal';
    let modal = document.getElementById(modalId);
    
    // Create the modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = '-1';
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${getTranslation('Market Sentiment Analysis')}: ${symbol}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="sentiment-content">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">${getTranslation('Analyzing market sentiment')}...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Update the content
    const sentimentContent = document.getElementById('sentiment-content');
    
    // Simulate sentiment analysis using our AI assistant
    // This would typically be an API call to a backend endpoint
    const message = `Analyze the current market sentiment for ${symbol}. Provide a sentiment score, explanation, and key factors.`;
    
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            sentimentContent.innerHTML = `
                <div class="mb-3">
                    ${formatMessage(data.response)}
                </div>
                <div class="text-muted small">
                    <i class="bi bi-info-circle"></i> ${getTranslation('This is an AI-generated analysis and should not be considered as financial advice.')}
                </div>
            `;
        })
        .catch(error => {
            console.error('Error analyzing sentiment:', error);
            sentimentContent.innerHTML = `
                <div class="alert alert-danger">
                    <h6>${getTranslation('Analysis Error')}</h6>
                    <p>${getTranslation('Failed to analyze market sentiment')}. ${getTranslation('Please try again later')}.</p>
                </div>
            `;
        });
}

// Get AI insights for an asset
function getAIInsights(symbol, name, assetType) {
    // Create a modal to display the AI insights
    const modalId = 'insightsModal';
    let modal = document.getElementById(modalId);
    
    // Create the modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = '-1';
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${getTranslation('AI Insights')}: ${name} (${symbol})</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="insights-content">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">${getTranslation('Generating insights')}...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } else {
        // Update the title
        modal.querySelector('.modal-title').textContent = `${getTranslation('AI Insights')}: ${name} (${symbol})`;
        
        // Reset content to loading state
        modal.querySelector('#insights-content').innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">${getTranslation('Generating insights')}...</p>
            </div>
        `;
    }
    
    // Show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Update the content
    const insightsContent = document.getElementById('insights-content');
    
    // Create a prompt for the AI assistant
    let prompt = '';
    if (assetType === 'stock') {
        prompt = `Provide detailed insights about ${name} (${symbol}) stock. Include information about its current market position, recent performance, potential risks and opportunities, and any notable news or events that might affect its value. Also suggest what type of investor might be interested in this stock and how it could fit into a diversified portfolio.`;
    } else {
        prompt = `Provide detailed insights about ${name} (${symbol}) cryptocurrency. Include information about its technology, use cases, market position, recent performance, potential risks and opportunities, and any notable developments that might affect its value. Also suggest what type of investor might be interested in this cryptocurrency and how it could fit into a diversified portfolio.`;
    }
    
    // Call the AI assistant
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: prompt })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            insightsContent.innerHTML = `
                <div class="mb-3">
                    ${formatMessage(data.response)}
                </div>
                <div class="text-muted small">
                    <i class="bi bi-info-circle"></i> ${getTranslation('This is an AI-generated analysis and should not be considered as financial advice.')}
                </div>
            `;
        })
        .catch(error => {
            console.error('Error getting AI insights:', error);
            insightsContent.innerHTML = `
                <div class="alert alert-danger">
                    <h6>${getTranslation('Analysis Error')}</h6>
                    <p>${getTranslation('Failed to generate insights')}. ${getTranslation('Please try again later')}.</p>
                </div>
            `;
        });
}

// Make the loadAssetData function globally available
window.loadAssetData = loadAssetData;
