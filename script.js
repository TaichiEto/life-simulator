class LifeSimulator {
    constructor() {
        this.chart = null;
        this.ageExpenseChart = null;
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
        
        this.lifeGoals = [];
        
        // 日本の年収データベース（厚生労働省「賃金構造基本統計調査」より）
        this.salaryDatabase = {
            byAge: {
                20: { average: 2780000, median: 2500000, deviation: 600000 },
                25: { average: 3420000, median: 3200000, deviation: 700000 },
                30: { average: 4090000, median: 3800000, deviation: 850000 },
                35: { average: 4680000, median: 4300000, deviation: 950000 },
                40: { average: 5140000, median: 4700000, deviation: 1100000 },
                45: { average: 5480000, median: 5000000, deviation: 1200000 },
                50: { average: 5760000, median: 5200000, deviation: 1300000 },
                55: { average: 5820000, median: 5250000, deviation: 1350000 },
                60: { average: 4950000, median: 4500000, deviation: 1200000 }
            },
            byEducation: {
                highSchool: { multiplier: 0.85 },
                university: { multiplier: 1.0 },
                graduate: { multiplier: 1.25 }
            },
            byCareer: {
                publicService: { multiplier: 0.95, stability: 'high' },
                largeCompany: { multiplier: 1.15, stability: 'high' },
                mediumCompany: { multiplier: 0.95, stability: 'medium' },
                smallCompany: { multiplier: 0.80, stability: 'low' },
                startup: { multiplier: 0.90, stability: 'low', potential: 'high' },
                freelance: { multiplier: 0.85, stability: 'low', potential: 'high' }
            },
            percentiles: {
                top1: 20000000,
                top5: 12000000,
                top10: 8500000,
                top25: 6000000,
                top50: 4330000,
                bottom25: 3200000,
                bottom10: 2500000
            }
        };
        
        this.init();
    }

    init() {
        this.loadDataFromStorage();
        this.setupEventListeners();
        this.calculateScholarshipPayment();
        this.checkShowTutorial();
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
                this.saveDataToStorage();
            });
        });
        
        // ライフゴール選択
        const goalCheckboxes = document.querySelectorAll('input[name="goals"]');
        goalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateLifeGoals();
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
        
        
        // 奨学金再計算ボタン（存在する場合のみ）
        const recalculateBtn = document.getElementById('recalculate-scholarship');
        if (recalculateBtn) {
            recalculateBtn.addEventListener('click', () => {
                this.calculateScholarshipPayment();
            });
        }
        
        // 年齢詳細パネルの閉じるボタン
        document.getElementById('close-age-details').addEventListener('click', () => {
            document.getElementById('age-details').style.display = 'none';
        });
        
        // チュートリアル関連のイベント
        document.getElementById('show-tutorial').addEventListener('click', () => {
            this.showTutorial();
        });
        
        document.getElementById('start-tutorial').addEventListener('click', () => {
            this.startTutorial();
        });
        
        document.getElementById('skip-tutorial').addEventListener('click', () => {
            this.skipTutorial();
        });
        
        // 計算実行ボタン
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculateRequiredIncome();
        });
        
        // プラン保存ボタン
        document.getElementById('export-plan-btn').addEventListener('click', () => {
            this.exportPlan();
        });
        
        // グラフ表示ボタン
        document.getElementById('show-chart-btn').addEventListener('click', () => {
            this.showDetailedChart();
        });

        // チャートタブ切り替え
        document.getElementById('asset-chart-tab').addEventListener('click', () => {
            this.switchChartTab('asset');
        });
        
        document.getElementById('expense-chart-tab').addEventListener('click', () => {
            this.switchChartTab('expense');
        });

        // 古いイベント管理UI（現在は非表示）
        const addEventBtn = document.getElementById('add-event-btn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                this.showEventForm();
            });
        }

        const saveEventBtn = document.getElementById('save-event-btn');
        if (saveEventBtn) {
            saveEventBtn.addEventListener('click', () => {
                this.saveEvent();
            });
        }

        const cancelEventBtn = document.getElementById('cancel-event-btn');
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', () => {
                this.hideEventForm();
            });
        }

        const resetDataBtn = document.getElementById('reset-data-btn');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                this.resetData();
            });
        }
    }

    handleUserTypeChange() {
        const userTypeElement = document.querySelector('input[name="user-type"]:checked');
        if (!userTypeElement) return;
        
        const userType = userTypeElement.value;
        this.basicInfo.userType = userType;
        
        const studentOnlyElements = document.querySelectorAll('.student-only');
        const workingOnlyElements = document.querySelectorAll('.working-only');
        const studentOptions = document.querySelectorAll('.student-option');
        
        if (userType === 'student') {
            studentOnlyElements.forEach(el => el.style.display = 'flex');
            workingOnlyElements.forEach(el => el.style.display = 'none');
            studentOptions.forEach(el => el.style.display = 'block');
            
            this.safeSetValue('current-age', 20);
            this.safeSetValue('current-savings', 100000);
        } else {
            studentOnlyElements.forEach(el => el.style.display = 'none');
            workingOnlyElements.forEach(el => el.style.display = 'block');
            studentOptions.forEach(el => el.style.display = 'none');
            
            this.safeSetValue('current-age', 25);
            this.safeSetValue('current-savings', 1000000);
        }
        
        this.updateBasicInfo();
    }

    safeSetValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    updateBasicInfo() {
        this.basicInfo = {
            ...this.basicInfo,
            currentAge: this.safeGetValue('current-age', 20),
            currentSavings: this.safeGetValue('current-savings', 100000),
            retireAge: this.safeGetValue('retire-age', 65),
            graduationAge: this.safeGetValue('graduation-age', 22),
            scholarshipDebt: this.safeGetValue('scholarship-debt', 0),
            scholarshipInterest: parseFloat(this.safeGetElementValue('scholarship-interest')) || 0.3,
            scholarshipYears: this.safeGetValue('scholarship-years', 15),
            scholarshipMonthly: this.basicInfo.scholarshipMonthly || 0
        };
    }

    safeGetValue(elementId, defaultValue) {
        const element = document.getElementById(elementId);
        return element ? (parseInt(element.value) || defaultValue) : defaultValue;
    }

    safeGetElementValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }

    updateFamilyPlan() {
        const marriageAge = this.safeGetValue('marriage-age', null);
        
        this.familyPlan = {
            marriageAge: marriageAge || null,
            spouseWorkType: this.safeGetElementValue('spouse-work-type') || 'full-time',
            spouseIncome: this.safeGetValue('spouse-income', 200000),
            childrenCount: this.safeGetValue('children-count', 0),
            children: this.familyPlan.children || []
        };
    }

    updateLifeGoals() {
        this.lifeGoals = [];
        const checkedGoals = document.querySelectorAll('input[name="goals"]:checked');
        
        checkedGoals.forEach(checkbox => {
            const goal = {
                id: checkbox.value,
                cost: parseInt(checkbox.dataset.cost) || 0,
                age: parseInt(checkbox.dataset.age) || this.basicInfo.currentAge + 5,
                recurring: checkbox.dataset.recurring === 'true',
                retireAge: parseInt(checkbox.dataset.retireAge) || null
            };
            
            // 早期リタイアの場合はリタイア年齢を更新
            if (goal.retireAge) {
                this.basicInfo.retireAge = goal.retireAge;
                document.getElementById('retire-age').value = goal.retireAge;
            }
            
            this.lifeGoals.push(goal);
        });
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


    calculateRequiredIncome() {
        this.updateBasicInfo();
        this.updateFamilyPlan();
        this.updateLifeGoals();
        
        // 基本生活費（東京基準）
        const basicLivingCost = 250000; // 月額基本生活費（東京）
        
        // 家族関連費用計算
        let totalFamilyCost = 0;
        const educationCosts = {
            public: { total: 8000000 },  // 小中高大の総額
            private: { total: 20000000 },
            mixed: { total: 14000000 }
        };
        
        this.familyPlan.children.forEach(child => {
            const costs = educationCosts[child.educationType];
            let childCost = costs.total;
            
            if (child.highEducation) {
                childCost += 2000000; // 大学院費用
            }
            
            childCost += 3000000; // 基本養育費
            totalFamilyCost += childCost;
        });
        
        // ライフゴール費用計算
        let totalGoalsCost = 0;
        let recurringGoalsCost = 0;
        
        this.lifeGoals.forEach(goal => {
            if (goal.recurring) {
                // 毎年の費用
                const yearsUntilRetire = Math.max(1, this.basicInfo.retireAge - this.basicInfo.currentAge);
                recurringGoalsCost += (goal.cost * yearsUntilRetire) / 12; // 月額換算
            } else {
                // 一時的な費用
                totalGoalsCost += goal.cost;
            }
        });
        
        // 奨学金返済
        const scholarshipCost = this.basicInfo.scholarshipMonthly;
        
        // リタイア資金（推定3000万円）
        const targetRetirementFund = 30000000;
        const yearsUntilRetire = Math.max(1, this.basicInfo.retireAge - this.basicInfo.currentAge);
        const monthlyRetirementSaving = (targetRetirementFund - this.basicInfo.currentSavings) / (yearsUntilRetire * 12);
        
        // 配偶者収入
        const spouseIncome = this.familyPlan.marriageAge ? this.familyPlan.spouseIncome : 0;
        
        // 月額計算
        const monthlyFamilyCost = totalFamilyCost / (yearsUntilRetire * 12);
        const monthlyGoalsCost = totalGoalsCost / (yearsUntilRetire * 12);
        
        const totalRequiredIncome = basicLivingCost + monthlyFamilyCost + monthlyGoalsCost + 
                                   recurringGoalsCost + scholarshipCost + monthlyRetirementSaving - spouseIncome;
        
        // 結果表示
        this.displayCalculationResults({
            requiredIncome: Math.max(0, totalRequiredIncome),
            basicLiving: basicLivingCost,
            familyCost: monthlyFamilyCost,
            goalsCost: monthlyGoalsCost + recurringGoalsCost,
            scholarshipCost: scholarshipCost,
            retirementSavings: monthlyRetirementSaving,
            spouseIncome: spouseIncome
        });
        
        this.generateTimeline();
        this.generateAdvice(totalRequiredIncome);
        
        // 結果が出たらボタン表示
        document.getElementById('export-plan-btn').style.display = 'inline-block';
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

    displayCalculationResults(results) {
        document.getElementById('required-monthly-income').textContent = 
            '¥' + this.formatNumber(Math.round(results.requiredIncome));
        
        document.getElementById('basic-living-cost').textContent = 
            '¥' + this.formatNumber(Math.round(results.basicLiving));
        
        document.getElementById('family-cost').textContent = 
            '¥' + this.formatNumber(Math.round(results.familyCost));
        
        document.getElementById('goals-cost').textContent = 
            '¥' + this.formatNumber(Math.round(results.goalsCost));
        
        document.getElementById('scholarship-cost').textContent = 
            '¥' + this.formatNumber(Math.round(results.scholarshipCost));
        
        document.getElementById('retirement-savings').textContent = 
            '¥' + this.formatNumber(Math.round(results.retirementSavings));
    }

    generateTimeline() {
        const timeline = document.getElementById('life-timeline');
        const events = [];
        
        // 結婚
        if (this.familyPlan.marriageAge) {
            events.push({
                age: this.familyPlan.marriageAge,
                event: '結婚',
                cost: 3000000 // 結婚費用概算
            });
        }
        
        // 子どもの誕生
        this.familyPlan.children.forEach((child, index) => {
            events.push({
                age: child.birthAge,
                event: `${index + 1}人目の子ども誕生`,
                cost: 500000
            });
        });
        
        // ライフゴール
        this.lifeGoals.forEach(goal => {
            if (!goal.recurring) {
                const goalNames = {
                    'tokyo-center': '都心に家を購入',
                    'tokyo-premium': '首都圏高級エリアに購入',
                    'tokyo-suburbs': '郊外に購入',
                    'tokyo-distant': '少し遠めに購入',
                    'renovation': '住宅リフォーム',
                    'car-new': '新車購入',
                    'car-premium': 'プレミアム車購入',
                    'car-luxury': '高級車購入',
                    'car-replacement': '車の定期買い替え',
                    'world-trip': '世界一周旅行',
                    'annual-travel-basic': '毎年の国内旅行',
                    'annual-travel-premium': '毎年の海外旅行',
                    'luxury-travel': '贅沢な記念旅行',
                    'mba-domestic': '国内MBA取得',
                    'mba-overseas': '海外MBA取得',
                    'language-study': '語学留学',
                    'skill-investment': '継続的なスキル投資',
                    'startup-small': '小規模起業',
                    'startup-large': '本格起業'
                };
                
                events.push({
                    age: goal.age,
                    event: goalNames[goal.id] || goal.id,
                    cost: goal.cost
                });
            }
        });
        
        // リタイア
        events.push({
            age: this.basicInfo.retireAge,
            event: 'リタイア',
            cost: 0
        });
        
        // 年齢順にソート
        events.sort((a, b) => a.age - b.age);
        
        // タイムライン表示
        timeline.innerHTML = events.map(event => `
            <div class="timeline-item">
                <div class="timeline-age">${event.age}歳</div>
                <div class="timeline-event">${event.event}</div>
                <div class="timeline-cost">${event.cost > 0 ? '¥' + this.formatNumber(event.cost) : ''}</div>
            </div>
        `).join('');
    }

    generateAdvice(requiredIncome) {
        const adviceContainer = document.getElementById('calculation-advice');
        const annualIncome = requiredIncome * 12; // 年収換算
        
        // 偏差値とランキング計算
        const salaryAnalysis = this.calculateSalaryDeviation(annualIncome, this.basicInfo.currentAge);
        
        let advice = [];
        
        // 偏差値に基づくアドバイス
        advice.push(`💰 <strong>年収偏差値: ${salaryAnalysis.deviation.toFixed(1)}</strong> (上位${salaryAnalysis.percentileRank.toFixed(1)}%)`);
        advice.push(`📊 同年代平均: ¥${this.formatNumber(salaryAnalysis.ageAverage)} / 全国平均: ¥${this.formatNumber(this.salaryDatabase.percentiles.top50)}`);
        
        if (this.basicInfo.userType === 'student') {
            const effortLevel = this.calculateStudentEffortLevel(annualIncome);
            advice.push(`🎓 <strong>大学生の就活・起業頑張り度: ${effortLevel.level}</strong>`);
            advice.push(`${effortLevel.description}`);
            advice.push(`💪 ${effortLevel.actionPlan}`);
        }
        
        if (requiredIncome > 1000000) {
            advice.push('💡 必要収入が高額です。以下を検討してください：');
            advice.push('• 配偶者の収入増加や働き方の見直し');
            advice.push('• ライフゴールの時期や内容の調整');
            advice.push('• 子どもの教育方針の見直し（公立中心など）');
            advice.push('• 早期からの投資運用で資産を増やす');
        } else if (requiredIncome > 500000) {
            advice.push('⚡ 実現可能な収入レベルです：');
            advice.push('• 着実なキャリアアップを目指しましょう');
            advice.push('• 副業や投資も検討してみてください');
            advice.push('• 家計の見直しで支出最適化も重要です');
        } else {
            advice.push('🎉 素晴らしい！実現可能性の高いプランです：');
            advice.push('• 余裕のある収入設定で安心です');
            advice.push('• さらなる目標追加も検討できます');
            advice.push('• 投資で資産をより効率的に増やしましょう');
        }
        
        adviceContainer.innerHTML = advice.map(text => `<p>${text}</p>`).join('');
    }

    // 年収偏差値計算
    calculateSalaryDeviation(annualIncome, age) {
        // 年齢に最も近いデータを取得
        const ageKeys = Object.keys(this.salaryDatabase.byAge).map(Number).sort((a, b) => a - b);
        let targetAge = ageKeys.reduce((prev, curr) => 
            Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
        );
        
        const ageData = this.salaryDatabase.byAge[targetAge];
        
        // 偏差値計算（平均50、標準偏差10）
        const deviation = 50 + ((annualIncome - ageData.average) / ageData.deviation) * 10;
        
        // パーセンタイル計算
        const zScore = (annualIncome - ageData.average) / ageData.deviation;
        const percentile = this.normalCDF(zScore) * 100;
        const percentileRank = 100 - percentile; // 上位何%か
        
        return {
            deviation: Math.max(0, Math.min(100, deviation)),
            percentileRank: Math.max(0.1, Math.min(99.9, percentileRank)),
            ageAverage: ageData.average,
            targetAge: targetAge
        };
    }

    // 正規累積分布関数の近似
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    // 誤差関数の近似
    erf(x) {
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }

    // 大学生の努力レベル計算
    calculateStudentEffortLevel(targetAnnualIncome) {
        const levels = [
            {
                threshold: 3000000,
                level: "⭐ 標準レベル",
                description: "一般的な就活で達成可能な年収です",
                actionPlan: "基本的な就活準備（ES、面接対策）をしっかりと行いましょう"
            },
            {
                threshold: 5000000,
                level: "⭐⭐ 頑張りレベル",
                description: "大手企業・人気業界を目指す年収です",
                actionPlan: "インターン参加、資格取得、語学力向上に取り組みましょう"
            },
            {
                threshold: 7000000,
                level: "⭐⭐⭐ 超頑張りレベル",
                description: "外資系・コンサル・IT大手レベルの年収です",
                actionPlan: "海外経験、難関資格、プログラミング技術など特別なスキルが必要です"
            },
            {
                threshold: 10000000,
                level: "⭐⭐⭐⭐ 起業・特殊技能レベル",
                description: "起業または超高度な専門技術が必要な年収です",
                actionPlan: "起業準備、AI・ブロックチェーンなど最先端技術習得、または医師・弁護士等の資格取得"
            },
            {
                threshold: Infinity,
                level: "⭐⭐⭐⭐⭐ レジェンドレベル",
                description: "上位0.1%の超高収入です",
                actionPlan: "成功した起業・投資、または芸能・スポーツ等での成功が必要です"
            }
        ];
        
        return levels.find(level => targetAnnualIncome <= level.threshold);
    }

    exportPlan() {
        const planData = {
            basicInfo: this.basicInfo,
            familyPlan: this.familyPlan,
            lifeGoals: this.lifeGoals,
            timestamp: new Date().toLocaleDateString('ja-JP')
        };
        
        const dataStr = JSON.stringify(planData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `人生プラン_${planData.timestamp}.json`;
        link.click();
    }

    showDetailedChart() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer.style.display === 'none') {
            chartContainer.style.display = 'block';
            this.updateChart();
            this.updateAgeExpenseChart();
            document.getElementById('show-chart-btn').textContent = 'グラフを非表示';
        } else {
            chartContainer.style.display = 'none';
            document.getElementById('show-chart-btn').textContent = 'グラフを表示';
        }
    }

    // チャートタブ切り替え
    switchChartTab(chartType) {
        const assetTab = document.getElementById('asset-chart-tab');
        const expenseTab = document.getElementById('expense-chart-tab');
        const assetChart = document.getElementById('asset-chart');
        const expenseChart = document.getElementById('age-expense-chart');

        if (chartType === 'asset') {
            assetTab.classList.add('active');
            expenseTab.classList.remove('active');
            assetChart.style.display = 'block';
            expenseChart.style.display = 'none';
        } else {
            assetTab.classList.remove('active');
            expenseTab.classList.add('active');
            assetChart.style.display = 'none';
            expenseChart.style.display = 'block';
            this.updateAgeExpenseChart();
        }
    }

    // 年齢別支出グラフの作成・更新
    updateAgeExpenseChart() {
        const ctx = document.getElementById('age-expense-chart').getContext('2d');
        const { ages, expenses, incomes, savings } = this.calculateAgeExpenseProgression();
        
        if (this.ageExpenseChart) {
            this.ageExpenseChart.destroy();
        }

        this.ageExpenseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ages,
                datasets: [
                    {
                        label: '月支出',
                        data: expenses,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: '月収入',
                        data: incomes,
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: '推奨貯蓄額',
                        data: savings,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '年齢別収入・支出・推奨貯蓄推移',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
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
                            text: '金額（円）',
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
                        const age = this.ageExpenseChart.data.labels[element.index];
                        this.showAgeDetails(age);
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
                            },
                            afterLabel: function(context) {
                                return 'クリックで詳細表示';
                            }
                        }
                    }
                }
            }
        });
    }

    // 年齢別支出・収入・推奨貯蓄の計算
    calculateAgeExpenseProgression() {
        const ages = [];
        const expenses = [];
        const incomes = [];
        const savings = [];
        
        let currentMonthlyIncome = this.basicInfo.monthlyIncome;
        let currentMonthlyExpense = this.basicInfo.monthlyExpense;
        
        for (let age = this.basicInfo.currentAge; age <= 80; age++) {
            ages.push(age);
            
            // 年齢に応じた理想収入の計算
            const ageData = this.salaryDatabase.byAge[this.getClosestAgeKey(age)];
            const idealAnnualIncome = ageData ? ageData.average : 4000000;
            const idealMonthlyIncome = idealAnnualIncome / 12;
            
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
                currentMonthlyExpense += 50000;
            }
            
            // 子どもによる支出変化
            this.familyPlan.children.forEach(child => {
                if (child.birthAge === age) {
                    currentMonthlyExpense += 30000;
                }
                
                const childAge = age - child.birthAge;
                if (childAge === 6) {
                    const monthlyCost = child.educationType === 'public' ? 15000 : 60000;
                    currentMonthlyExpense += monthlyCost;
                } else if (childAge === 12) {
                    const monthlyCost = child.educationType === 'public' ? 20000 : 80000;
                    currentMonthlyExpense += monthlyCost - (child.educationType === 'public' ? 15000 : 60000);
                } else if (childAge === 15) {
                    const monthlyCost = child.educationType === 'public' ? 25000 : 100000;
                    currentMonthlyExpense += monthlyCost - (child.educationType === 'public' ? 20000 : 80000);
                } else if (childAge === 18) {
                    currentMonthlyExpense -= (child.educationType === 'public' ? 25000 : 100000);
                } else if (childAge === 22 || (childAge === 24 && child.highEducation)) {
                    currentMonthlyExpense -= 30000;
                }
            });
            
            // リタイア後の収入減少
            if (age >= this.basicInfo.retireAge) {
                currentMonthlyIncome = idealMonthlyIncome * 0.6; // 年金等
                currentMonthlyExpense *= 0.8; // 支出減少
            }
            
            // 推奨貯蓄額の計算
            const yearsToRetire = Math.max(0, this.basicInfo.retireAge - age);
            const targetRetirementAssets = 30000000;
            const recommendedMonthlySaving = yearsToRetire > 0 ? 
                targetRetirementAssets / (yearsToRetire * 12) : 0;
            
            expenses.push(Math.round(currentMonthlyExpense));
            incomes.push(Math.round(idealMonthlyIncome));
            savings.push(Math.round(recommendedMonthlySaving));
        }
        
        return { ages, expenses, incomes, savings };
    }

    // 最も近い年齢のキーを取得
    getClosestAgeKey(age) {
        const ageKeys = Object.keys(this.salaryDatabase.byAge).map(Number).sort((a, b) => a - b);
        return ageKeys.reduce((prev, curr) => 
            Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
        );
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
        
        // 理想的な収入と貯蓄の計算
        const idealData = this.calculateIdealIncomeAndSavings(age);
        
        document.getElementById('selected-age-title').textContent = `${age}歳時点の詳細分析`;
        document.getElementById('detail-assets').textContent = `¥${this.formatNumber(ageData.assets)}`;
        document.getElementById('detail-income').textContent = `¥${this.formatNumber(ageData.monthlyIncome)}`;
        document.getElementById('detail-ideal-income').textContent = `¥${this.formatNumber(idealData.idealMonthlyIncome)}`;
        document.getElementById('detail-expense').textContent = `¥${this.formatNumber(ageData.monthlyExpense)}`;
        document.getElementById('detail-ideal-savings').textContent = `¥${this.formatNumber(idealData.idealTotalSavings)}`;
        
        const annualBalance = (ageData.monthlyIncome - ageData.monthlyExpense) * 12;
        document.getElementById('detail-annual-balance').textContent = `¥${this.formatNumber(annualBalance)}`;
        document.getElementById('detail-annual-balance').style.color = annualBalance >= 0 ? '#27ae60' : '#e74c3c';
        
        // 推奨事項の生成
        const recommendations = this.generateRecommendations(age, ageData);
        const recommendationsList = document.getElementById('detail-recommendations');
        recommendationsList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
        
        // 目標達成条件の生成（理想データを含む）
        const requirements = this.generateRequirements(age, ageData, idealData);
        document.getElementById('detail-requirements').innerHTML = requirements;
        
        document.getElementById('age-details').style.display = 'block';
    }

    // 理想的な収入と貯蓄の計算
    calculateIdealIncomeAndSavings(targetAge) {
        // 年齢に応じた理想年収
        const ageData = this.salaryDatabase.byAge[this.getClosestAgeKey(targetAge)];
        const idealAnnualIncome = ageData ? ageData.average : 4000000;
        const idealMonthlyIncome = idealAnnualIncome / 12;
        
        // 年齢に応じた理想貯蓄額の計算
        let idealTotalSavings = 0;
        
        if (targetAge < 30) {
            // 20代：年収の1年分程度
            idealTotalSavings = idealAnnualIncome * 1;
        } else if (targetAge < 40) {
            // 30代：年収の2-3年分程度
            idealTotalSavings = idealAnnualIncome * 2.5;
        } else if (targetAge < 50) {
            // 40代：年収の4-5年分程度
            idealTotalSavings = idealAnnualIncome * 4;
        } else if (targetAge < this.basicInfo.retireAge) {
            // 50代-リタイア前：退職金含め年収の6-8年分程度
            idealTotalSavings = idealAnnualIncome * 6;
        } else {
            // リタイア後：3000万円目標
            idealTotalSavings = 30000000;
        }
        
        return {
            idealAnnualIncome,
            idealMonthlyIncome,
            idealTotalSavings
        };
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

    checkShowTutorial() {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            this.showTutorial();
        }
    }

    showTutorial() {
        document.getElementById('tutorial-modal').style.display = 'block';
    }

    startTutorial() {
        localStorage.setItem('hasSeenTutorial', 'true');
        document.getElementById('tutorial-modal').style.display = 'none';
        
        // 簡単なガイドを表示
        this.showTutorialHighlights();
    }

    skipTutorial() {
        localStorage.setItem('hasSeenTutorial', 'true');
        document.getElementById('tutorial-modal').style.display = 'none';
    }

    showTutorialHighlights() {
        const highlights = [
            {
                selector: '.user-type-selector',
                message: '📚 まずはあなたの状況を選択してください',
                duration: 3000
            },
            {
                selector: '.basic-info-form',
                message: '💰 基本的な収入・支出情報を入力してみましょう',
                duration: 3000
            },
            {
                selector: '.family-plan-form',
                message: '👨‍👩‍👧‍👦 将来の家族計画も設定できます',
                duration: 3000
            },
            {
                selector: '.chart-container',
                message: '📊 グラフの任意の年齢をクリックして詳細を確認できます',
                duration: 4000
            }
        ];

        let currentHighlight = 0;

        const showNextHighlight = () => {
            if (currentHighlight >= highlights.length) return;

            const highlight = highlights[currentHighlight];
            const element = document.querySelector(highlight.selector);
            
            if (element) {
                this.createHighlightTooltip(element, highlight.message);
                
                setTimeout(() => {
                    this.removeHighlightTooltip();
                    currentHighlight++;
                    if (currentHighlight < highlights.length) {
                        setTimeout(showNextHighlight, 500);
                    }
                }, highlight.duration);
            } else {
                currentHighlight++;
                setTimeout(showNextHighlight, 100);
            }
        };

        setTimeout(showNextHighlight, 1000);
    }

    createHighlightTooltip(element, message) {
        // 既存のツールチップを削除
        this.removeHighlightTooltip();
        
        // 要素をハイライト
        element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.8)';
        element.style.position = 'relative';
        element.style.zIndex = '999';
        
        // ツールチップを作成
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.innerHTML = `
            <div class="tutorial-tooltip-content">
                ${message}
                <div class="tutorial-tooltip-arrow"></div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // 位置を調整
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.top = (rect.bottom + 10) + 'px';
        tooltip.style.left = rect.left + 'px';
        tooltip.style.zIndex = '1000';
        
        this.currentHighlightedElement = element;
        this.currentTooltip = tooltip;
    }

    removeHighlightTooltip() {
        if (this.currentHighlightedElement) {
            this.currentHighlightedElement.style.boxShadow = '';
            this.currentHighlightedElement.style.zIndex = '';
            this.currentHighlightedElement = null;
        }
        
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    saveDataToStorage() {
        const data = {
            basicInfo: this.basicInfo,
            familyPlan: this.familyPlan,
            lifeEvents: this.lifeEvents,
            lifeGoals: this.lifeGoals
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
                this.lifeGoals = data.lifeGoals || [];
                
                // ユーザータイプの設定
                const userTypeRadio = document.querySelector(`input[value="${this.basicInfo.userType}"]`);
                if (userTypeRadio) {
                    userTypeRadio.checked = true;
                    this.handleUserTypeChange();
                }
                
                // 基本情報の復元
                this.safeSetValue('current-age', this.basicInfo.currentAge);
                this.safeSetValue('current-savings', this.basicInfo.currentSavings);
                this.safeSetValue('retire-age', this.basicInfo.retireAge);
                
                // 大学生関連情報の復元
                if (this.basicInfo.graduationAge) {
                    this.safeSetValue('graduation-age', this.basicInfo.graduationAge);
                }
                if (this.basicInfo.scholarshipDebt) {
                    this.safeSetValue('scholarship-debt', this.basicInfo.scholarshipDebt);
                }
                if (this.basicInfo.scholarshipInterest) {
                    this.safeSetValue('scholarship-interest', this.basicInfo.scholarshipInterest);
                }
                if (this.basicInfo.scholarshipYears) {
                    this.safeSetValue('scholarship-years', this.basicInfo.scholarshipYears);
                }
                
                // 家族計画の復元
                if (this.familyPlan.marriageAge) {
                    this.safeSetValue('marriage-age', this.familyPlan.marriageAge);
                    this.toggleMarriageDependentFields();
                }
                this.safeSetValue('spouse-work-type', this.familyPlan.spouseWorkType);
                this.safeSetValue('spouse-income', this.familyPlan.spouseIncome);
                this.safeSetValue('children-count', this.familyPlan.childrenCount);
                
                // ライフゴールの復元
                this.lifeGoals.forEach(goal => {
                    const checkbox = document.querySelector(`input[value="${goal.id}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
                
                if (this.familyPlan.childrenCount > 0) {
                    this.updateChildrenDetails();
                }
                
                // 古いデータ構造の場合はリセット
            } catch (error) {
                console.error('データの読み込みに失敗しました:', error);
                // 古いデータをクリア
                localStorage.removeItem('lifeSimulatorData');
                this.resetToDefaults();
            }
        }
    }

    resetToDefaults() {
        this.basicInfo = {
            userType: 'working',
            currentAge: 20,
            currentSavings: 100000,
            retireAge: 65,
            graduationAge: 22,
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
        this.lifeGoals = [];
        this.lifeEvents = [];
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
            this.lifeGoals = [];
            
            // UI要素のリセット
            document.querySelector('input[value="working"]').checked = true;
            this.handleUserTypeChange();
            
            document.getElementById('marriage-age').value = '';
            document.getElementById('spouse-work-type').value = 'full-time';
            document.getElementById('spouse-income').value = 200000;
            document.getElementById('children-count').value = 0;
            
            this.toggleMarriageDependentFields();
            this.updateChildrenDetails();
        }
    }
}

let simulator;

document.addEventListener('DOMContentLoaded', () => {
    simulator = new LifeSimulator();
});