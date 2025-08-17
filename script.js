class LifeSimulator {
    constructor() {
        this.chart = null;
        this.lifeEvents = [];
        this.basicInfo = {
            currentAge: 25,
            currentSavings: 1000000,
            monthlyIncome: 300000,
            monthlyExpense: 200000,
            retireAge: 65
        };
        
        this.init();
    }

    init() {
        this.loadDataFromStorage();
        this.setupEventListeners();
        this.updateSummaryCards();
        this.updateChart();
        this.renderEventsUI();
    }

    setupEventListeners() {
        const form = document.getElementById('basic-info-form');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateBasicInfo();
                this.updateSummaryCards();
                this.updateChart();
                this.saveDataToStorage();
            });
        });

        document.getElementById('add-event-btn').addEventListener('click', () => {
            this.showEventForm();
        });

        document.getElementById('save-event-btn').addEventListener('click', () => {
            this.saveEvent();
        });

        document.getElementById('cancel-event-btn').addEventListener('click', () => {
            this.hideEventForm();
        });

        document.getElementById('reset-data-btn').addEventListener('click', () => {
            this.resetData();
        });
    }

    updateBasicInfo() {
        this.basicInfo = {
            currentAge: parseInt(document.getElementById('current-age').value) || 25,
            currentSavings: parseInt(document.getElementById('current-savings').value) || 0,
            monthlyIncome: parseInt(document.getElementById('monthly-income').value) || 0,
            monthlyExpense: parseInt(document.getElementById('monthly-expense').value) || 0,
            retireAge: parseInt(document.getElementById('retire-age').value) || 65
        };
    }

    updateSummaryCards() {
        const existingCards = document.querySelector('.summary-cards');
        if (existingCards) {
            existingCards.remove();
        }

        const summaryCards = document.createElement('div');
        summaryCards.className = 'summary-cards';
        
        const monthlyDifference = this.basicInfo.monthlyIncome - this.basicInfo.monthlyExpense;
        const yearlyDifference = monthlyDifference * 12;
        
        summaryCards.innerHTML = `
            <div class="summary-card income-card">
                <h4>月収入</h4>
                <div class="value">¥${this.formatNumber(this.basicInfo.monthlyIncome)}</div>
            </div>
            <div class="summary-card expense-card">
                <h4>月支出</h4>
                <div class="value">¥${this.formatNumber(this.basicInfo.monthlyExpense)}</div>
            </div>
            <div class="summary-card">
                <h4>月差額</h4>
                <div class="value" style="color: ${monthlyDifference >= 0 ? '#27ae60' : '#e74c3c'}">
                    ¥${this.formatNumber(monthlyDifference)}
                </div>
            </div>
            <div class="summary-card">
                <h4>年差額</h4>
                <div class="value" style="color: ${yearlyDifference >= 0 ? '#27ae60' : '#e74c3c'}">
                    ¥${this.formatNumber(yearlyDifference)}
                </div>
            </div>
        `;

        const basicInfoForm = document.querySelector('.basic-info-form');
        basicInfoForm.insertAdjacentElement('afterend', summaryCards);
    }

    calculateAssetProgression() {
        const ages = [];
        const assets = [];
        
        let currentAsset = this.basicInfo.currentSavings;
        const monthlyNet = this.basicInfo.monthlyIncome - this.basicInfo.monthlyExpense;
        
        for (let age = this.basicInfo.currentAge; age <= 80; age++) {
            ages.push(age);
            
            const eventsThisYear = this.lifeEvents.filter(event => event.age === age);
            let yearlyChange = 0;
            
            if (age < this.basicInfo.retireAge) {
                yearlyChange = monthlyNet * 12;
            }
            
            eventsThisYear.forEach(event => {
                switch (event.type) {
                    case 'income-change':
                        if (age < this.basicInfo.retireAge) {
                            yearlyChange += event.amount * 12;
                        }
                        break;
                    case 'expense-change':
                        yearlyChange -= event.amount * 12;
                        break;
                    case 'one-time-income':
                        yearlyChange += event.amount;
                        break;
                    case 'one-time-expense':
                        yearlyChange -= event.amount;
                        break;
                }
            });
            
            currentAsset += yearlyChange;
            assets.push(Math.max(0, currentAsset));
        }
        
        return { ages, assets };
    }

    updateChart() {
        const ctx = document.getElementById('asset-chart').getContext('2d');
        const { ages, assets } = this.calculateAssetProgression();
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ages,
                datasets: [{
                    label: '資産額',
                    data: assets,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '将来の資産推移予測',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '年齢',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '資産額（円）',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.x}歳: ¥${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                annotation: {
                    annotations: {
                        retireLine: {
                            type: 'line',
                            xMin: this.basicInfo.retireAge,
                            xMax: this.basicInfo.retireAge,
                            borderColor: '#e74c3c',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'リタイア',
                                enabled: true,
                                position: 'top'
                            }
                        }
                    }
                }
            }
        });
    }

    showEventForm() {
        document.getElementById('event-form').style.display = 'block';
        document.getElementById('event-age').value = '';
        document.getElementById('event-type').value = '';
        document.getElementById('event-amount').value = '';
        document.getElementById('event-description').value = '';
    }

    hideEventForm() {
        document.getElementById('event-form').style.display = 'none';
    }

    saveEvent() {
        const age = parseInt(document.getElementById('event-age').value);
        const type = document.getElementById('event-type').value;
        const amount = parseInt(document.getElementById('event-amount').value);
        const description = document.getElementById('event-description').value;

        if (!age || !type || !amount || !description) {
            alert('全ての項目を入力してください。');
            return;
        }

        if (age < this.basicInfo.currentAge || age > 80) {
            alert('年齢は現在の年齢から80歳の間で入力してください。');
            return;
        }

        const event = {
            id: Date.now(),
            age,
            type,
            amount,
            description
        };

        this.lifeEvents.push(event);
        this.lifeEvents.sort((a, b) => a.age - b.age);
        
        this.updateChart();
        this.renderEventsUI();
        this.hideEventForm();
        this.saveDataToStorage();
    }

    deleteEvent(eventId) {
        this.lifeEvents = this.lifeEvents.filter(event => event.id !== eventId);
        this.updateChart();
        this.renderEventsUI();
        this.saveDataToStorage();
    }

    renderEventsUI() {
        const container = document.getElementById('events-container');
        
        if (this.lifeEvents.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d; font-style: italic;">まだイベントが追加されていません</p>';
            return;
        }

        container.innerHTML = this.lifeEvents.map(event => {
            const typeLabels = {
                'income-change': '収入変化',
                'expense-change': '支出変化',
                'one-time-income': '一時収入',
                'one-time-expense': '一時支出'
            };

            const isNegative = event.type === 'expense-change' || event.type === 'one-time-expense';
            const amountClass = isNegative ? 'negative' : '';
            const sign = isNegative ? '-' : '+';

            return `
                <div class="event-item">
                    <div class="event-info">
                        <div class="event-age">${event.age}歳</div>
                        <div class="event-description">${event.description}</div>
                        <div class="event-amount ${amountClass}">${sign}¥${this.formatNumber(event.amount)}</div>
                        <div class="event-type">${typeLabels[event.type]}</div>
                    </div>
                    <button class="delete-event-btn" onclick="simulator.deleteEvent(${event.id})">削除</button>
                </div>
            `;
        }).join('');
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    saveDataToStorage() {
        const data = {
            basicInfo: this.basicInfo,
            lifeEvents: this.lifeEvents
        };
        localStorage.setItem('lifeSimulatorData', JSON.stringify(data));
    }

    loadDataFromStorage() {
        const savedData = localStorage.getItem('lifeSimulatorData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.basicInfo = { ...this.basicInfo, ...data.basicInfo };
                this.lifeEvents = data.lifeEvents || [];
                
                document.getElementById('current-age').value = this.basicInfo.currentAge;
                document.getElementById('current-savings').value = this.basicInfo.currentSavings;
                document.getElementById('monthly-income').value = this.basicInfo.monthlyIncome;
                document.getElementById('monthly-expense').value = this.basicInfo.monthlyExpense;
                document.getElementById('retire-age').value = this.basicInfo.retireAge;
            } catch (error) {
                console.error('データの読み込みに失敗しました:', error);
            }
        }
    }

    resetData() {
        if (confirm('全てのデータをリセットしますか？この操作は取り消せません。')) {
            localStorage.removeItem('lifeSimulatorData');
            this.lifeEvents = [];
            this.basicInfo = {
                currentAge: 25,
                currentSavings: 1000000,
                monthlyIncome: 300000,
                monthlyExpense: 200000,
                retireAge: 65
            };
            
            document.getElementById('current-age').value = this.basicInfo.currentAge;
            document.getElementById('current-savings').value = this.basicInfo.currentSavings;
            document.getElementById('monthly-income').value = this.basicInfo.monthlyIncome;
            document.getElementById('monthly-expense').value = this.basicInfo.monthlyExpense;
            document.getElementById('retire-age').value = this.basicInfo.retireAge;
            
            this.updateSummaryCards();
            this.updateChart();
            this.renderEventsUI();
        }
    }
}

let simulator;

document.addEventListener('DOMContentLoaded', () => {
    simulator = new LifeSimulator();
});