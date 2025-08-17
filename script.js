class LifeSimulator {
    constructor() {
        this.chart = null;
        this.lifeEvents = [];
        this.basicInfo = {
            userType: 'working',
            currentAge: 20,
            currentSavings: 100000,
            monthlyIncome: 80000,
            monthlyExpense: 70000,
            retireAge: 65,
            graduationAge: 22,
            startingSalary: 250000,
            scholarshipDebt: 0,
            scholarshipInterest: 0.3,
            scholarshipYears: 15,
            scholarshipMonthly: 0
        };
        
        this.familyPlan = {
            marriageAge: null,
            spouseWorkType: 'full-time',
            spouseIncome: 200000,
            childrenCount: 0,
            children: []
        };
        
        this.init();
    }

    init() {
        this.loadDataFromStorage();
        this.setupEventListeners();
        this.calculateScholarshipPayment();
        this.updateSummaryCards();
        this.updateChart();
        this.renderEventsUI();
    }

    setupEventListeners() {
        const form = document.getElementById('basic-info-form');
        const familyForm = document.getElementById('family-plan-form');
        const userTypeInputs = document.querySelectorAll('input[name="user-type"]');
        
        // ユーザータイプ切り替え
        userTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.handleUserTypeChange();
            });
        });
        
        // 基本情報フォーム
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateBasicInfo();
                this.updateSummaryCards();
                this.updateChart();
                this.saveDataToStorage();
            });
        });
        
        // 家族計画フォーム
        const familyInputs = familyForm.querySelectorAll('input, select');
        familyInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFamilyPlan();
                this.updateChart();
                this.saveDataToStorage();
            });
        });
        
        // 結婚年齢変更時の配偶者情報表示切り替え
        document.getElementById('marriage-age').addEventListener('input', () => {
            this.toggleMarriageDependentFields();
        });
        
        // 子ども人数変更時の詳細設定表示切り替え
        document.getElementById('children-count').addEventListener('input', () => {
            this.updateChildrenDetails();
        });
        
        // 自動計算ボタン
        document.getElementById('auto-calculate-children').addEventListener('click', () => {
            this.autoCalculateChildren();
        });
        
        // 奨学金再計算ボタン
        document.getElementById('recalculate-scholarship').addEventListener('click', () => {
            this.calculateScholarshipPayment();
        });
        
        // 年齢詳細パネルの閉じるボタン
        document.getElementById('close-age-details').addEventListener('click', () => {
            document.getElementById('age-details').style.display = 'none';
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

    handleUserTypeChange() {
        const userType = document.querySelector('input[name="user-type"]:checked').value;
        this.basicInfo.userType = userType;
        
        const studentOnlyElements = document.querySelectorAll('.student-only');
        const workingOnlyElements = document.querySelectorAll('.working-only');
        const studentOptions = document.querySelectorAll('.student-option');
        
        if (userType === 'student') {
            studentOnlyElements.forEach(el => el.style.display = 'flex');
            workingOnlyElements.forEach(el => el.style.display = 'none');
            studentOptions.forEach(el => el.style.display = 'block');
            
            document.getElementById('current-age').value = 20;
            document.getElementById('current-savings').value = 100000;
            document.getElementById('monthly-income').value = 80000;
            document.getElementById('monthly-expense').value = 70000;
        } else {
            studentOnlyElements.forEach(el => el.style.display = 'none');
            workingOnlyElements.forEach(el => el.style.display = 'block');
            studentOptions.forEach(el => el.style.display = 'none');
            
            document.getElementById('current-age').value = 25;
            document.getElementById('current-savings').value = 1000000;
            document.getElementById('monthly-income').value = 300000;
            document.getElementById('monthly-expense').value = 200000;
        }
        
        this.updateBasicInfo();
        this.updateSummaryCards();
        this.updateChart();
    }

    updateBasicInfo() {
        this.basicInfo = {
            ...this.basicInfo,
            currentAge: parseInt(document.getElementById('current-age').value) || 20,
            currentSavings: parseInt(document.getElementById('current-savings').value) || 0,
            monthlyIncome: parseInt(document.getElementById('monthly-income').value) || 0,
            monthlyExpense: parseInt(document.getElementById('monthly-expense').value) || 0,
            retireAge: parseInt(document.getElementById('retire-age').value) || 65,
            graduationAge: parseInt(document.getElementById('graduation-age').value) || 22,
            startingSalary: parseInt(document.getElementById('starting-salary').value) || 250000,
            scholarshipDebt: parseInt(document.getElementById('scholarship-debt').value) || 0,
            scholarshipInterest: parseFloat(document.getElementById('scholarship-interest').value) || 0.3,
            scholarshipYears: parseInt(document.getElementById('scholarship-years').value) || 15,
            scholarshipMonthly: this.basicInfo.scholarshipMonthly
        };
    }

    updateFamilyPlan() {
        const marriageAge = parseInt(document.getElementById('marriage-age').value) || null;
        
        this.familyPlan = {
            marriageAge: marriageAge,
            spouseWorkType: document.getElementById('spouse-work-type').value,
            spouseIncome: parseInt(document.getElementById('spouse-income').value) || 0,
            childrenCount: parseInt(document.getElementById('children-count').value) || 0,
            children: this.familyPlan.children
        };
        
        this.calculateRequiredIncome();
    }

    toggleMarriageDependentFields() {
        const marriageAge = parseInt(document.getElementById('marriage-age').value);
        const marriageDependentElements = document.querySelectorAll('.marriage-dependent');
        
        if (marriageAge && marriageAge > 0) {
            marriageDependentElements.forEach(el => el.style.display = 'flex');
        } else {
            marriageDependentElements.forEach(el => el.style.display = 'none');
        }
    }

    updateChildrenDetails() {
        const childrenCount = parseInt(document.getElementById('children-count').value) || 0;
        const childrenDetails = document.getElementById('children-details');
        const childrenContainer = document.getElementById('children-container');
        
        if (childrenCount > 0) {
            childrenDetails.style.display = 'block';
            
            while (this.familyPlan.children.length < childrenCount) {
                this.familyPlan.children.push({
                    birthAge: this.basicInfo.currentAge + 2 + this.familyPlan.children.length,
                    educationType: 'public',
                    highEducation: false
                });
            }
            
            if (this.familyPlan.children.length > childrenCount) {
                this.familyPlan.children = this.familyPlan.children.slice(0, childrenCount);
            }
            
            this.renderChildrenForm();
        } else {
            childrenDetails.style.display = 'none';
            this.familyPlan.children = [];
        }
    }

    renderChildrenForm() {
        const container = document.getElementById('children-container');
        container.innerHTML = '';
        
        this.familyPlan.children.forEach((child, index) => {
            const childDiv = document.createElement('div');
            childDiv.className = 'child-item';
            childDiv.innerHTML = `
                <h5>${index + 1}人目の子ども</h5>
                <div class="form-group">
                    <label>出産予定年齢</label>
                    <input type="number" class="child-birth-age" data-index="${index}" value="${child.birthAge}" min="${this.basicInfo.currentAge}" max="50">
                    <span class="unit">歳</span>
                </div>
                <div class="form-group">
                    <label>教育方針</label>
                    <select class="child-education-type" data-index="${index}">
                        <option value="public" ${child.educationType === 'public' ? 'selected' : ''}>公立中心</option>
                        <option value="private" ${child.educationType === 'private' ? 'selected' : ''}>私立中心</option>
                        <option value="mixed" ${child.educationType === 'mixed' ? 'selected' : ''}>公立→私立</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>大学進学</label>
                    <select class="child-high-education" data-index="${index}">
                        <option value="false" ${!child.highEducation ? 'selected' : ''}>大学まで</option>
                        <option value="true" ${child.highEducation ? 'selected' : ''}>大学院まで</option>
                    </select>
                </div>
            `;
            container.appendChild(childDiv);
        });
        
        container.querySelectorAll('.child-birth-age, .child-education-type, .child-high-education').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.className.split('-').slice(1).join('');
                
                if (field === 'birthage') {
                    this.familyPlan.children[index].birthAge = parseInt(e.target.value);
                } else if (field === 'educationtype') {
                    this.familyPlan.children[index].educationType = e.target.value;
                } else if (field === 'higheducation') {
                    this.familyPlan.children[index].highEducation = e.target.value === 'true';
                }
                
                this.calculateRequiredIncome();
                this.updateChart();
                this.saveDataToStorage();
            });
        });
    }

    autoCalculateChildren() {
        const currentAge = this.basicInfo.currentAge;
        const marriageAge = this.familyPlan.marriageAge || currentAge + 3;
        
        this.familyPlan.children.forEach((child, index) => {
            child.birthAge = marriageAge + 2 + (index * 2);
            child.educationType = 'public';
            child.highEducation = false;
        });
        
        this.renderChildrenForm();
        this.calculateRequiredIncome();
        this.updateChart();
        this.saveDataToStorage();
    }

    calculateRequiredIncome() {
        let totalChildCost = 0;
        const educationCosts = {
            public: { elementary: 200000, junior: 250000, high: 300000, university: 4000000 },
            private: { elementary: 800000, junior: 1000000, high: 1200000, university: 5000000 },
            mixed: { elementary: 200000, junior: 250000, high: 1200000, university: 4500000 }
        };
        
        this.familyPlan.children.forEach(child => {
            const costs = educationCosts[child.educationType];
            let childCost = costs.elementary + costs.junior + costs.high + costs.university;
            
            if (child.highEducation) {
                childCost += 2000000;
            }
            
            childCost += 2000000;
            totalChildCost += childCost;
        });
        
        const yearsUntilRetire = this.basicInfo.retireAge - this.basicInfo.currentAge;
        const requiredMonthlyForChildren = totalChildCost / (yearsUntilRetire * 12);
        const spouseIncome = this.familyPlan.marriageAge ? this.familyPlan.spouseIncome : 0;
        const requiredPersonalIncome = this.basicInfo.monthlyExpense + requiredMonthlyForChildren + this.basicInfo.scholarshipMonthly - spouseIncome;
        
        this.displayRequiredIncome(Math.max(0, requiredPersonalIncome));
    }

    calculateScholarshipPayment() {
        const debt = this.basicInfo.scholarshipDebt;
        const annualRate = this.basicInfo.scholarshipInterest / 100;
        const years = this.basicInfo.scholarshipYears;
        
        if (debt <= 0) {
            this.basicInfo.scholarshipMonthly = 0;
            document.getElementById('calculated-monthly-payment').textContent = '¥0';
            return;
        }
        
        if (annualRate === 0) {
            // 無利子の場合
            this.basicInfo.scholarshipMonthly = Math.round(debt / (years * 12));
        } else {
            // 有利子の場合（元利均等返済）
            const monthlyRate = annualRate / 12;
            const totalMonths = years * 12;
            const monthlyPayment = debt * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                                 (Math.pow(1 + monthlyRate, totalMonths) - 1);
            this.basicInfo.scholarshipMonthly = Math.round(monthlyPayment);
        }
        
        document.getElementById('calculated-monthly-payment').textContent = 
            '¥' + this.formatNumber(this.basicInfo.scholarshipMonthly);
        
        this.updateSummaryCards();
        this.updateChart();
        this.calculateRequiredIncome();
        this.saveDataToStorage();
    }

    displayRequiredIncome(requiredIncome) {
        let existingDisplay = document.querySelector('.required-income-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        if (this.familyPlan.childrenCount > 0 || this.familyPlan.marriageAge) {
            const display = document.createElement('div');
            display.className = 'required-income-display';
            display.innerHTML = `
                <h4>目標月収入</h4>
                <div class="required-income-value">¥${this.formatNumber(Math.round(requiredIncome))}</div>
                <div class="required-income-note">家族計画を実現するために必要な手取り月収</div>
            `;
            
            document.querySelector('.family-plan-form').appendChild(display);
        }
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
        let currentMonthlyIncome = this.basicInfo.monthlyIncome;
        let currentMonthlyExpense = this.basicInfo.monthlyExpense;
        
        for (let age = this.basicInfo.currentAge; age <= 80; age++) {
            ages.push(age);
            
            // 大学生の就職による収入変化
            if (this.basicInfo.userType === 'student' && age === this.basicInfo.graduationAge) {
                currentMonthlyIncome = this.basicInfo.startingSalary;
                currentMonthlyExpense += this.basicInfo.scholarshipMonthly;
            }
            
            // 結婚による収入・支出変化
            if (this.familyPlan.marriageAge === age) {
                if (this.familyPlan.spouseWorkType !== 'homemaker') {
                    currentMonthlyIncome += this.familyPlan.spouseIncome;
                }
                // 結婚による生活費増加（概算）
                currentMonthlyExpense += 50000;
            }
            
            // 子どもによる支出変化
            this.familyPlan.children.forEach(child => {
                if (child.birthAge === age) {
                    // 出産・育児費用
                    currentAsset -= 500000; // 出産費用
                    currentMonthlyExpense += 30000; // 乳幼児期の月間費用
                }
                
                // 教育費の段階的変化
                const childAge = age - child.birthAge;
                if (childAge === 6) { // 小学校入学
                    const monthlyCost = child.educationType === 'public' ? 15000 : 60000;
                    currentMonthlyExpense += monthlyCost;
                }
                if (childAge === 12) { // 中学校入学
                    const monthlyCost = child.educationType === 'public' ? 20000 : 80000;
                    currentMonthlyExpense += monthlyCost - (child.educationType === 'public' ? 15000 : 60000);
                }
                if (childAge === 15) { // 高校入学
                    const monthlyCost = (child.educationType === 'public') ? 25000 : 
                                       (child.educationType === 'private') ? 100000 : 100000;
                    currentMonthlyExpense += monthlyCost - (child.educationType === 'public' ? 20000 : 80000);
                }
                if (childAge === 18) { // 大学入学
                    const universityCost = (child.educationType === 'public') ? 4000000 : 
                                          (child.educationType === 'private') ? 5000000 : 4500000;
                    currentAsset -= universityCost / 4; // 年間授業料
                    currentMonthlyExpense -= (child.educationType === 'public') ? 25000 : 100000; // 高校費用終了
                }
                if (childAge === 22 && child.highEducation) { // 大学院進学
                    currentAsset -= 500000; // 年間授業料
                }
                if (childAge === 22 || (childAge === 24 && child.highEducation)) { // 独立
                    currentMonthlyExpense -= 30000; // 基本生活費減少
                }
            });
            
            const eventsThisYear = this.lifeEvents.filter(event => event.age === age);
            let yearlyChange = 0;
            
            if (age < this.basicInfo.retireAge) {
                yearlyChange = (currentMonthlyIncome - currentMonthlyExpense) * 12;
            }
            
            eventsThisYear.forEach(event => {
                switch (event.type) {
                    case 'income-change':
                        if (age < this.basicInfo.retireAge) {
                            yearlyChange += event.amount * 12;
                            currentMonthlyIncome += event.amount;
                        }
                        break;
                    case 'expense-change':
                        yearlyChange -= event.amount * 12;
                        currentMonthlyExpense += event.amount;
                        break;
                    case 'one-time-income':
                        yearlyChange += event.amount;
                        break;
                    case 'one-time-expense':
                        yearlyChange -= event.amount;
                        break;
                    case 'job-start':
                        if (age >= this.basicInfo.graduationAge) {
                            currentMonthlyIncome = event.amount;
                        }
                        break;
                    case 'scholarship-start':
                        if (age >= this.basicInfo.graduationAge) {
                            currentMonthlyExpense += event.amount;
                        }
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
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const element = elements[0];
                        const age = this.chart.data.labels[element.index];
                        this.showAgeDetails(age);
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.x}歳: ¥${context.parsed.y.toLocaleString()}`;
                            },
                            afterLabel: function(context) {
                                return 'クリックで詳細表示';
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

    showAgeDetails(age) {
        const ageData = this.calculateAgeSpecificData(age);
        
        document.getElementById('selected-age-title').textContent = `${age}歳時点の詳細分析`;
        document.getElementById('detail-assets').textContent = `¥${this.formatNumber(ageData.assets)}`;
        document.getElementById('detail-income').textContent = `¥${this.formatNumber(ageData.monthlyIncome)}`;
        document.getElementById('detail-expense').textContent = `¥${this.formatNumber(ageData.monthlyExpense)}`;
        
        const annualBalance = (ageData.monthlyIncome - ageData.monthlyExpense) * 12;
        document.getElementById('detail-annual-balance').textContent = `¥${this.formatNumber(annualBalance)}`;
        document.getElementById('detail-annual-balance').style.color = annualBalance >= 0 ? '#27ae60' : '#e74c3c';
        
        // 推奨事項の生成
        const recommendations = this.generateRecommendations(age, ageData);
        const recommendationsList = document.getElementById('detail-recommendations');
        recommendationsList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
        
        // 目標達成条件の生成
        const requirements = this.generateRequirements(age, ageData);
        document.getElementById('detail-requirements').innerHTML = requirements;
        
        document.getElementById('age-details').style.display = 'block';
    }

    calculateAgeSpecificData(targetAge) {
        let currentAsset = this.basicInfo.currentSavings;
        let currentMonthlyIncome = this.basicInfo.monthlyIncome;
        let currentMonthlyExpense = this.basicInfo.monthlyExpense;
        
        for (let age = this.basicInfo.currentAge; age <= targetAge; age++) {
            // 大学生の就職による変化
            if (this.basicInfo.userType === 'student' && age === this.basicInfo.graduationAge) {
                currentMonthlyIncome = this.basicInfo.startingSalary;
                currentMonthlyExpense += this.basicInfo.scholarshipMonthly;
            }
            
            // 結婚による変化
            if (this.familyPlan.marriageAge === age) {
                if (this.familyPlan.spouseWorkType !== 'homemaker') {
                    currentMonthlyIncome += this.familyPlan.spouseIncome;
                }
                currentMonthlyExpense += 50000;
            }
            
            // 子どもによる変化
            this.familyPlan.children.forEach(child => {
                if (child.birthAge === age) {
                    currentAsset -= 500000;
                    currentMonthlyExpense += 30000;
                }
                
                const childAge = age - child.birthAge;
                if (childAge === 6) {
                    const monthlyCost = child.educationType === 'public' ? 15000 : 60000;
                    currentMonthlyExpense += monthlyCost;
                }
                if (childAge === 12) {
                    const monthlyCost = child.educationType === 'public' ? 20000 : 80000;
                    currentMonthlyExpense += monthlyCost - (child.educationType === 'public' ? 15000 : 60000);
                }
                if (childAge === 15) {
                    const monthlyCost = (child.educationType === 'public') ? 25000 : 100000;
                    currentMonthlyExpense += monthlyCost - (child.educationType === 'public' ? 20000 : 80000);
                }
                if (childAge === 18) {
                    const universityCost = (child.educationType === 'public') ? 4000000 : 
                                          (child.educationType === 'private') ? 5000000 : 4500000;
                    currentAsset -= universityCost / 4;
                    currentMonthlyExpense -= (child.educationType === 'public') ? 25000 : 100000;
                }
                if (childAge === 22 || (childAge === 24 && child.highEducation)) {
                    currentMonthlyExpense -= 30000;
                }
            });
            
            if (age < targetAge && age < this.basicInfo.retireAge) {
                currentAsset += (currentMonthlyIncome - currentMonthlyExpense) * 12;
            }
        }
        
        return {
            assets: Math.max(0, currentAsset),
            monthlyIncome: currentMonthlyIncome,
            monthlyExpense: currentMonthlyExpense
        };
    }

    generateRecommendations(age, ageData) {
        const recommendations = [];
        const annualBalance = (ageData.monthlyIncome - ageData.monthlyExpense) * 12;
        
        if (age < 30) {
            recommendations.push('投資や資産形成の基盤作りに最適な時期です');
            if (annualBalance < 500000) {
                recommendations.push('支出の見直しや副業を検討してみましょう');
            }
            recommendations.push('緊急資金として生活費の3-6ヶ月分の貯蓄を目指しましょう');
        } else if (age < 40) {
            recommendations.push('結婚や住宅購入を視野に入れた資金計画を立てましょう');
            if (this.familyPlan.childrenCount > 0) {
                recommendations.push('教育資金の準備を始めることをお勧めします');
            }
            recommendations.push('つみたてNISAやiDeCoなどの制度を活用しましょう');
        } else if (age < 50) {
            recommendations.push('教育費のピークに備えた資金管理が重要です');
            recommendations.push('退職後の生活設計を具体的に検討し始めましょう');
            if (annualBalance > 1000000) {
                recommendations.push('余剰資金の効率的な運用を検討しましょう');
            }
        } else if (age < this.basicInfo.retireAge) {
            recommendations.push('退職金や年金の見込み額を確認しましょう');
            recommendations.push('リタイア後の生活費を具体的に試算しましょう');
            recommendations.push('住宅ローンの完済計画を立てましょう');
        } else {
            recommendations.push('資産の取り崩し計画を慎重に検討しましょう');
            recommendations.push('医療・介護費用に備えた資金確保が重要です');
        }
        
        return recommendations;
    }

    generateRequirements(age, ageData) {
        const annualBalance = (ageData.monthlyIncome - ageData.monthlyExpense) * 12;
        const yearsToRetire = Math.max(0, this.basicInfo.retireAge - age);
        const targetRetirementAssets = 30000000; // 目標リタイア資産
        
        let requirements = `<p><strong>安定した生活のために：</strong></p>`;
        
        if (age < this.basicInfo.retireAge) {
            const requiredAnnualSaving = yearsToRetire > 0 ? 
                Math.max(0, (targetRetirementAssets - ageData.assets) / yearsToRetire) : 0;
            
            requirements += `<p>・退職までに必要な年間貯蓄額: <strong>¥${this.formatNumber(Math.round(requiredAnnualSaving))}</strong></p>`;
            requirements += `<p>・現在の年間収支: <strong>¥${this.formatNumber(annualBalance)}</strong></p>`;
            
            if (annualBalance < requiredAnnualSaving) {
                const shortfall = requiredAnnualSaving - annualBalance;
                const requiredIncomeIncrease = shortfall / 12;
                requirements += `<p>・不足分を補うために必要な月収入増加: <strong>¥${this.formatNumber(Math.round(requiredIncomeIncrease))}</strong></p>`;
                requirements += `<p>・または月支出削減: <strong>¥${this.formatNumber(Math.round(requiredIncomeIncrease))}</strong></p>`;
            } else {
                requirements += `<p>✅ 現在のペースで目標達成可能です</p>`;
            }
        } else {
            const safeWithdrawalRate = 0.04; // 4%ルール
            const sustainableAnnualIncome = ageData.assets * safeWithdrawalRate;
            requirements += `<p>・資産¥${this.formatNumber(ageData.assets)}で年間取り崩し可能額: <strong>¥${this.formatNumber(Math.round(sustainableAnnualIncome))}</strong></p>`;
            requirements += `<p>・月あたり: <strong>¥${this.formatNumber(Math.round(sustainableAnnualIncome / 12))}</strong></p>`;
        }
        
        return requirements;
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    saveDataToStorage() {
        const data = {
            basicInfo: this.basicInfo,
            familyPlan: this.familyPlan,
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
                this.familyPlan = { ...this.familyPlan, ...data.familyPlan };
                this.lifeEvents = data.lifeEvents || [];
                
                // ユーザータイプの設定
                const userTypeRadio = document.querySelector(`input[value="${this.basicInfo.userType}"]`);
                if (userTypeRadio) {
                    userTypeRadio.checked = true;
                    this.handleUserTypeChange();
                }
                
                // 基本情報の復元
                document.getElementById('current-age').value = this.basicInfo.currentAge;
                document.getElementById('current-savings').value = this.basicInfo.currentSavings;
                document.getElementById('monthly-income').value = this.basicInfo.monthlyIncome;
                document.getElementById('monthly-expense').value = this.basicInfo.monthlyExpense;
                document.getElementById('retire-age').value = this.basicInfo.retireAge;
                
                if (this.basicInfo.graduationAge) {
                    document.getElementById('graduation-age').value = this.basicInfo.graduationAge;
                }
                if (this.basicInfo.startingSalary) {
                    document.getElementById('starting-salary').value = this.basicInfo.startingSalary;
                }
                if (this.basicInfo.scholarshipDebt) {
                    document.getElementById('scholarship-debt').value = this.basicInfo.scholarshipDebt;
                }
                if (this.basicInfo.scholarshipInterest) {
                    document.getElementById('scholarship-interest').value = this.basicInfo.scholarshipInterest;
                }
                if (this.basicInfo.scholarshipYears) {
                    document.getElementById('scholarship-years').value = this.basicInfo.scholarshipYears;
                }
                
                // 家族計画の復元
                if (this.familyPlan.marriageAge) {
                    document.getElementById('marriage-age').value = this.familyPlan.marriageAge;
                    this.toggleMarriageDependentFields();
                }
                document.getElementById('spouse-work-type').value = this.familyPlan.spouseWorkType;
                document.getElementById('spouse-income').value = this.familyPlan.spouseIncome;
                document.getElementById('children-count').value = this.familyPlan.childrenCount;
                
                if (this.familyPlan.childrenCount > 0) {
                    this.updateChildrenDetails();
                }
                
                this.calculateRequiredIncome();
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
                userType: 'working',
                currentAge: 20,
                currentSavings: 100000,
                monthlyIncome: 80000,
                monthlyExpense: 70000,
                retireAge: 65,
                graduationAge: 22,
                startingSalary: 250000,
                scholarshipDebt: 0,
                scholarshipInterest: 0.3,
                scholarshipYears: 15,
                scholarshipMonthly: 0
            };
            this.familyPlan = {
                marriageAge: null,
                spouseWorkType: 'full-time',
                spouseIncome: 200000,
                childrenCount: 0,
                children: []
            };
            
            // UI要素のリセット
            document.querySelector('input[value="working"]').checked = true;
            this.handleUserTypeChange();
            
            document.getElementById('marriage-age').value = '';
            document.getElementById('spouse-work-type').value = 'full-time';
            document.getElementById('spouse-income').value = 200000;
            document.getElementById('children-count').value = 0;
            
            this.toggleMarriageDependentFields();
            this.updateChildrenDetails();
            this.updateSummaryCards();
            this.updateChart();
            this.renderEventsUI();
            this.calculateRequiredIncome();
        }
    }
}

let simulator;

document.addEventListener('DOMContentLoaded', () => {
    simulator = new LifeSimulator();
});