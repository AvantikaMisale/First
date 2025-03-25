/**
 * Utility functions for creating and managing financial charts
 */

// Function to create a line chart for asset price history
function createPriceChart(chartId, dates, prices, color = '#4CAF50') {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, `${color}33`);  // Semi-transparent color
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Calculate price change for determining color
    const priceChange = prices[prices.length - 1] - prices[0];
    const chartColor = priceChange >= 0 ? '#4CAF50' : '#F44336';
    
    // Create the chart
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: chartColor,
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: chartColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Price: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxTicksLimit: 7,
                        align: 'start',
                        color: '#6c757d'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    position: 'right',
                    ticks: {
                        color: '#6c757d'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Function to create a pie chart for portfolio allocation
function createAllocationChart(chartId, labels, data) {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Generate colors for each segment
    const colors = generateColors(data.length);
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        color: '#6c757d'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${percentage}% (${formatCurrency(value)})`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Function to create a bar chart for performance comparison
function createPerformanceChart(chartId, labels, datasets) {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#6c757d'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        color: '#6c757d'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#6c757d'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Helper function to generate an array of colors
function generateColors(count) {
    const colors = [
        '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336',
        '#009688', '#673AB7', '#FF5722', '#3F51B5', '#E91E63',
        '#8BC34A', '#03A9F4', '#FFEB3B', '#FF9800', '#607D8B'
    ];
    
    // If we need more colors than in our array, we'll repeat them
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    
    return result;
}

// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Format percentage values
function formatPercentage(value) {
    return `${value.toFixed(2)}%`;
}

// Format large numbers with K, M, B suffixes
function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

// Update chart data without destroying the chart
function updateChartData(chart, labels, datasets) {
    chart.data.labels = labels;
    
    // Update datasets
    datasets.forEach((dataset, index) => {
        if (chart.data.datasets[index]) {
            Object.assign(chart.data.datasets[index], dataset);
        } else {
            chart.data.datasets.push(dataset);
        }
    });
    
    // Remove extra datasets if needed
    if (chart.data.datasets.length > datasets.length) {
        chart.data.datasets.splice(datasets.length);
    }
    
    chart.update();
}
