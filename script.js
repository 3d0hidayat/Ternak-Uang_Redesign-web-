// =================================================================
// KELAS UNTUK CHART DI HERO SECTION (Latar Belakang)
// =================================================================
class TradingChart {
    constructor() {
        this.data = [];
        this.svg = document.getElementById('tradingChart');

        this.margin = {top: 50, right: 0, bottom: 50, left: 0};
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;

        this.candleWidth = 8;
        this.candleSpacing = 10;
        this.maxCandles = Math.floor(this.width / this.candleSpacing) + 10;

        this.init();
    }

    init() {
        this.data = [];
        if (!this.svg) return;
        this.svg.innerHTML = '';
        this.buildUpInitialChart();
    }

    createFirstCandle() {
        const now = new Date();
        const initialPrice = 43000;
        return { time: now, open: initialPrice, high: initialPrice + 50, low: initialPrice - 50, close: initialPrice + (Math.random() - 0.5) * 100, volume: Math.random() * 1000000 + 100000 };
    }

    generateNextCandle(lastCandle) {
        const now = new Date(lastCandle.time.getTime() + 60000);
        const open = lastCandle.close + (Math.random() - 0.5) * 50;
        const close = open + (Math.random() - 0.5) * 100;
        const high = Math.max(open, close) + Math.random() * 75;
        const low = Math.min(open, close) - Math.random() * 75;
        const volume = Math.random() * 1000000 + 100000;

        return { time: now, open: Math.round(open), high: Math.round(high), low: Math.round(low), close: Math.round(close), volume: Math.round(volume) };
    }

    buildUpInitialChart() {
        let currentCandleCount = 0;
        const totalInitialCandlesToBuild = this.maxCandles;
        const buildUpSpeedMs = 10;

        const addNextInitialCandle = () => {
            if (currentCandleCount < totalInitialCandlesToBuild) {
                const lastCandle = this.data.length > 0 ? this.data[this.data.length - 1] : this.createFirstCandle();
                const newCandle = this.generateNextCandle(lastCandle);
                this.data.push(newCandle);
                if (this.data.length > this.maxCandles) { this.data.shift(); }

                this.render();
                currentCandleCount++;
                setTimeout(addNextInitialCandle, buildUpSpeedMs);
            } else {
                this.startRealTimeUpdates();
            }
        };
        addNextInitialCandle();
    }

    addNewCandle() {
        const lastCandle = this.data[this.data.length - 1];
        const newCandle = this.generateNextCandle(lastCandle);
        this.data.push(newCandle);
        if (this.data.length > this.maxCandles) { this.data.shift(); }
    }

    render() {
        if (!this.svg) return;
        this.svg.innerHTML = '';
        if (this.data.length === 0) return;

        const visibleData = this.data.slice(-this.maxCandles);
        const prices = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
        const minPrice = Math.min(...prices) * 0.999;
        const maxPrice = Math.max(...prices) * 1.001;

        const xScale = (i) => this.margin.left + i * this.candleSpacing;
        const yScale = (price) => this.margin.top + (maxPrice - price) / (maxPrice - minPrice) * this.height;

        this.drawGrid(minPrice, maxPrice, yScale);

        visibleData.forEach((candle, i) => {
            this.drawCandle(candle, xScale(i), yScale, i === visibleData.length - 1);
        });
    }

    drawGrid(minPrice, maxPrice, yScale) {
        for (let i = 0; i <= 10; i++) {
            const price = minPrice + i * (maxPrice - minPrice) / 10;
            const y = yScale(price);
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", this.margin.left);
            line.setAttribute("y1", y);
            line.setAttribute("x2", this.margin.left + this.width);
            line.setAttribute("y2", y);
            line.setAttribute("class", "grid-line");
            this.svg.appendChild(line);
        }
    }

    drawCandle(candle, x, yScale, isNew = false) {
        const isBullish = candle.close > candle.open;
        const bodyTop = yScale(Math.max(candle.open, candle.close));
        const bodyBottom = yScale(Math.min(candle.open, candle.close));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
        const wickTop = yScale(candle.high);
        const wickBottom = yScale(candle.low);

        const candleClass = isBullish ? 'bullish' : 'bearish';
        const animateClass = isNew ? 'animate' : '';

        const candleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        candleGroup.setAttribute("class", `candle ${candleClass} ${animateClass}`);

        const upperWick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        upperWick.setAttribute("x1", x); upperWick.setAttribute("y1", wickTop); upperWick.setAttribute("x2", x); upperWick.setAttribute("y2", bodyTop); upperWick.setAttribute("class", "candle-wick");
        candleGroup.appendChild(upperWick);

        const lowerWick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lowerWick.setAttribute("x1", x); lowerWick.setAttribute("y1", bodyBottom); lowerWick.setAttribute("x2", x); lowerWick.setAttribute("y2", wickBottom); lowerWick.setAttribute("class", "candle-wick");
        candleGroup.appendChild(lowerWick);

        const bodyRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bodyRect.setAttribute("x", x - this.candleWidth/2); bodyRect.setAttribute("y", bodyTop); bodyRect.setAttribute("width", this.candleWidth); bodyRect.setAttribute("height", bodyHeight); bodyRect.setAttribute("class", "candle-body");
        candleGroup.appendChild(bodyRect);

        this.svg.appendChild(candleGroup);
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.addNewCandle();
            this.render();
        }, 300);
    }
}

// =================================================================
// LOGIKA UNTUK FULL-PAGE SCROLL
// =================================================================
let currentSectionIndex = 0;
let isAnimatingSection = false;
let scrollTimeout;

function updateSectionPositions() {
    const sections = document.querySelectorAll('.section');
    const body = document.body;
    body.classList.remove('features-section-active-bg', 'modern-features-active-bg');
    sections.forEach((section, index) => {
        section.classList.remove('active', 'next', 'prev');
        if (index === currentSectionIndex) {
            section.classList.add('active');
            if (section.classList.contains('features-section-fullpage')) {
                body.classList.add('features-section-active-bg');
            } else if (section.classList.contains('modern-features-section')) {
                body.classList.add('modern-features-active-bg');
            }
        } else if (index > currentSectionIndex) {
            section.classList.add('next');
        } else {
            section.classList.add('prev');
        }
    });
}

function goToSection(index) {
    const sections = document.querySelectorAll('.section');
    if (index === currentSectionIndex || isAnimatingSection || index < 0 || index >= sections.length) {
        return;
    }
    isAnimatingSection = true;
    currentSectionIndex = index;
    updateSectionPositions();
    setTimeout(() => {
        isAnimatingSection = false;
    }, 800);
}

function handleScroll(e) {
    if (isAnimatingSection) {
        e.preventDefault();
        return;
    }
    const delta = e.deltaY || e.detail || e.wheelDelta;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        if (delta > 0) {
            goToSection(currentSectionIndex + 1);
        } else {
            goToSection(currentSectionIndex - 1);
        }
    }, 50);
}

let touchStartY = 0;
let touchEndTime = 0;

document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchEndTime = Date.now();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (isAnimatingSection) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaTime = Date.now() - touchEndTime;
    const deltaY = touchStartY - touchEndY;
    if (Math.abs(deltaY) > 50 && deltaTime < 500) {
        if (deltaY > 0) {
            goToSection(currentSectionIndex + 1);
        } else {
            goToSection(currentSectionIndex - 1);
        }
    }
});


// =================================================================
// KELAS UNTUK TERMINAL BLOOMBERG INTERAKTIF
// =================================================================
let terminalInstance = null;
let isTerminalInitialized = false;

class BloombergTerminal {
    constructor() {
        this.priceHistory = [];
        this.labels = [];
        this.sma50Data = [];
        this.sma100Data = [];
        this.sma200Data = [];

        this.basePrice = 4.9479;
        this.currentPrice = this.basePrice;
        this.dayHigh = this.basePrice;
        this.dayLow = this.basePrice;
        this.volume = 1200000;
        this.chart = null;

        this.initChart();
        this.generateHistoricalData();
        this.startRealTimeUpdates();
        this.updateTimeDisplay();
    }

    calculateSMA(data, period) {
        const sma = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                sma.push(sum / period);
            }
        }
        return sma;
    }

    initChart() {
        const ctx = document.getElementById('priceChart')?.getContext('2d');
        if (!ctx) return;
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [{
                    label: 'Price',
                    data: this.priceHistory,
                    borderColor: '#00aaff',
                    backgroundColor: 'rgba(0, 170, 255, 0.05)',
                    borderWidth: 1.5,
                    fill: true,
                    pointRadius: 0,
                    tension: 0.1
                }, {
                    label: 'SMA 50',
                    data: this.sma50Data,
                    borderColor: '#ff00ff',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                }, {
                    label: 'SMA 100',
                    data: this.sma100Data,
                    borderColor: '#00ff00',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                }, {
                    label: 'SMA 200',
                    data: this.sma200Data,
                    borderColor: '#ffff00',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        titleColor: '#ff6600',
                        bodyColor: '#fff',
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ccc', font: { size: 10 }, maxTicksLimit: 8 }
                    },
                    y: {
                        position: 'right',
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#ccc', font: { size: 10 } }
                    }
                },
                animation: { duration: 0 }
            }
        });
    }

    calculateAllMovingAverages() {
        this.sma50Data = this.calculateSMA(this.priceHistory, 50);
        this.sma100Data = this.calculateSMA(this.priceHistory, 100);
        this.sma200Data = this.calculateSMA(this.priceHistory, 200);
    }

    generateHistoricalData() {
        this.priceHistory = [];
        this.labels = [];
        let price = 1.5;
        const dataPoints = 500;
        
        for (let i = 0; i < dataPoints; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (dataPoints - i));
            const change = (Math.random() - 0.48) * 0.05;
            price += change;
            price = Math.max(1.0, price);
            this.priceHistory.push(price);
            this.labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        }
        this.currentPrice = price;
        this.basePrice = price;

        this.calculateAllMovingAverages();
        this.updateChartData();
    }
    
    updateChartData() {
        if (!this.chart) return;
        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = this.priceHistory;
        this.chart.data.datasets[1].data = this.sma50Data;
        this.chart.data.datasets[2].data = this.sma100Data;
        this.chart.data.datasets[3].data = this.sma200Data;
        this.chart.update('none');
    }

    startRealTimeUpdates() {
        setInterval(() => {
            this.updatePrice();
            this.updateDisplay();
        }, 2000);
    }

    updatePrice() {
        const change = (Math.random() - 0.5) * 0.01;
        this.currentPrice += change;

        if (this.currentPrice > this.dayHigh) this.dayHigh = this.currentPrice;
        if (this.currentPrice < this.dayLow) this.dayLow = this.currentPrice;
        this.volume += Math.floor(Math.random() * 5000) - 2500;
        
        this.priceHistory.push(this.currentPrice);
        this.labels.push(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        if (this.priceHistory.length > 500) {
            this.priceHistory.shift();
            this.labels.shift();
        }
        this.calculateAllMovingAverages();
        this.updateChartData();
    }

    updateDisplay() {
        const change = this.currentPrice - this.basePrice;
        const changePercent = (change / this.basePrice) * 100;
        const changeEl = document.getElementById('priceChange');
        const priceChangePercentEl = document.getElementById('priceChangePercent');

        document.getElementById('lastPrice').textContent = this.currentPrice.toFixed(4);
        if (changeEl) changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(4);
        if (priceChangePercentEl) priceChangePercentEl.textContent = (change >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
        
        document.getElementById('dayHigh').textContent = this.dayHigh.toFixed(4);
        document.getElementById('dayLow').textContent = this.dayLow.toFixed(4);
        document.getElementById('volume').textContent = (this.volume / 1000000).toFixed(2) + 'M';
        document.getElementById('statusPrice').textContent = this.currentPrice.toFixed(4);

        if (changeEl) {
            if (change >= 0) {
                changeEl.classList.add('status-green');
                changeEl.classList.remove('status-red');
            } else {
                changeEl.classList.add('status-red');
                changeEl.classList.remove('status-green');
            }
        }
    }

    updateTimeDisplay() {
        const statusTimeEl = document.getElementById('statusTime');
        const updateTime = () => {
            const now = new Date();
            if (statusTimeEl) statusTimeEl.textContent = now.toLocaleTimeString('en-US');
        };
        updateTime();
        setInterval(updateTime, 1000);
    }
}

// =================================================================
// INISIALISASI SAAT DOKUMEN SIAP
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Chart Utama
    new TradingChart();

    // Logika Full-page Scroll
    updateSectionPositions();
    document.addEventListener('wheel', handleScroll, { passive: false });
    document.body.style.overflow = 'hidden';

    // Carousel Logic
    let autoPlayInterval;
    const startAutoPlay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (currentSectionIndex === 1) {
                const radios = document.querySelectorAll('input[name="slider"]');
                let currentIndex = -1;
                radios.forEach((radio, index) => {
                    if (radio.checked) {
                        currentIndex = index;
                    }
                });
                if (currentIndex !== -1) {
                    const nextIndex = (currentIndex + 1) % radios.length;
                    radios[nextIndex].checked = true;
                }
            }
        }, 5000);
    };
    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    };
    document.querySelectorAll('input[name="slider"]').forEach(radio => {
        radio.addEventListener('change', resetAutoPlay);
    });
    startAutoPlay();

    // Observer untuk Autoplay Carousel DAN Inisialisasi Terminal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const targetSection = mutation.target;
                if (targetSection.classList.contains('active') && targetSection.dataset.sectionId === '1') {
                    startAutoPlay();
                } else {
                    clearInterval(autoPlayInterval);
                }
                if (targetSection.classList.contains('active') && targetSection.dataset.sectionId === '3' && !isTerminalInitialized) {
                    if (!terminalInstance) {
                        terminalInstance = new BloombergTerminal();
                    }
                    isTerminalInitialized = true;
                }
            }
        });
    });
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section, { attributes: true, attributeFilter: ['class'] });
    });

    // LOGIKA UNTUK POP-UP (MODAL) - DIGABUNG DI SINI
    const modalOverlay = document.getElementById('terms-modal-overlay');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (modalOverlay && openModalBtn && closeModalBtn) {
        openModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modalOverlay.classList.add('active');
        });

        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }
});