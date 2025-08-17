document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    const EDUCATION_COSTS = {
        // 年間費用
        public_elem: 350000,    // 公立小学校
        public_middle: 540000,   // 公立中学校
        public_high: 520000,    // 公立高校
        private_elem: 1670000,   // 私立小学校
        private_middle: 1440000,  // 私立中学校
        private_high: 1050000,   // 私立高校
        uni_public: 650000,     // 国公立大学
        uni_private_liberal: 1030000, // 私立大学（文系）
        uni_private_science: 1380000, // 私立大学（理系）
        uni_private_medical: 4000000, // 私立大学（医歯薬系） 6年間の平均
    };

    const EDUCATION_TRACKS = {
        all_public: { name: 'すべて国公立', stages: { elem: 'public', middle: 'public', high: 'public', uni: 'uni_public' } },
        high_private: { name: '高校から私立', stages: { elem: 'public', middle: 'public', high: 'private', uni: 'uni_private_science' } },
        all_private: { name: 'すべて私立', stages: { elem: 'private', middle: 'private', high: 'private', uni: 'uni_private_science' } },
        all_private_medical: { name: 'すべて私立（医歯薬系）', stages: { elem: 'private', middle: 'private', high: 'private', uni: 'uni_private_medical' } },
    };

    const LIFE_EVENT_DATA = {
        housing: {
            'house-regional': { name: '地方に家を購入', cost: 30000000, loanTerm: 35, interestRate: 1.8 },
            'house-capital-suburbs': { name: '首都圏郊外に家を購入', cost: 45000000, loanTerm: 35, interestRate: 1.8 },
            'condo-capital': { name: '首都圏にマンションを購入', cost: 80000000, loanTerm: 35, interestRate: 1.8 },
        },
        car: {
            'car-standard': { name: '標準的な新車を購入', cost: 2500000, loanTerm: 7, interestRate: 3.0 },
            'car-luxury': { name: '高級車を購入', cost: 8000000, loanTerm: 7, interestRate: 3.0 },
        }
    };
    const CORE_LIVING_COST_ANNUAL = (80000 * 12); // 食費・光熱費・通信費・雑費など
    const ANNUAL_RENT = 1200000; // 家賃 年120万
    const PROPERTY_MAINTENANCE_RATE = 0.005; // 固定資産税・維持費率
    const RETIREMENT_GOAL_AMOUNT = 30000000;
    const AFTER_TAX_RATE = 0.8;
    const LOAN_LIMIT_RATIO = 5;

    // --- DOM Elements ---
    const calculateBtn = document.getElementById('calculate-btn');
    const housingPlan = document.getElementById('housing-plan');
    const carPlan = document.getElementById('car-plan');
    const childrenCount = document.getElementById('children-count');
    const childrenPlansContainer = document.getElementById('children-plans-container');
    const resultsSection = document.querySelector('.results-section');
    const chartCanvas = document.getElementById('asset-chart');
    const loanRequirementNote = document.getElementById('loan-requirement-note');
    const modal = document.getElementById('age-detail-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    let assetChart = null;
    let currentProgressionData = null;

    // --- Main Functions ---
    const calculateAndDisplayResults = () => {
        calculateBtn.disabled = true;
        calculateBtn.textContent = '計算中...';

        setTimeout(() => {
            try {
                const inputs = readUserInputs();
                const lifeEvents = buildLifeEvents(inputs);
                currentProgressionData = calculateFinancialProgression(inputs, lifeEvents);
                
                displayLoanRequirement(currentProgressionData.peakLoanEvent);
                renderChart(currentProgressionData);
                displayTimeline(lifeEvents);

                resultsSection.style.display = 'block';
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error("Calculation Error:", error);
                alert("計算中にエラーが発生しました。入力値を確認してください。");
            }
            finally {
                calculateBtn.disabled = false;
                calculateBtn.textContent = '🔥 あなたの未来を計算する';
            }
        }, 0);
    };

    const calculateFinancialProgression = (inputs, lifeEvents) => {
        const { graduationAge, retireAge, currentSavings, graphEndAge, targetDisposableIncome } = inputs;
        const labels = [], assetData = [], incomeData = [], expenseDetails = [];
        let currentAsset = currentSavings;
        const displayEndAge = Math.min(retireAge, graphEndAge);
        
        let peakLoanRequiredIncome = 0;
        let peakLoanEvent = null;
        lifeEvents.filter(e => e.type === 'loan').forEach(event => {
            const required = event.cost / LOAN_LIMIT_RATIO;
            if (required > peakLoanRequiredIncome) {
                peakLoanRequiredIncome = required;
                peakLoanEvent = event;
            }
        });

        const annualRetirementSaving = (RETIREMENT_GOAL_AMOUNT - currentSavings) / (retireAge - graduationAge);
        let activeLoans = [];
        const housingEvent = lifeEvents.find(e => e.type === 'loan' && e.name.includes('購入'));

        for (let age = graduationAge; age <= displayEndAge; age++) {
            labels.push(age);

            lifeEvents.filter(e => e.type === 'loan' && e.age === age).forEach(event => {
                activeLoans.push({ ...event, endAge: age + event.loanTerm });
            });
            activeLoans = activeLoans.filter(loan => age < loan.endAge);

            // Dynamic Annual Costs
            let annualLivingCost = CORE_LIVING_COST_ANNUAL;
            if (housingEvent) {
                if (age < housingEvent.age) {
                    annualLivingCost += ANNUAL_RENT;
                } else {
                    annualLivingCost += housingEvent.cost * PROPERTY_MAINTENANCE_RATE;
                }
            } else {
                annualLivingCost += ANNUAL_RENT;
            }

            const annualScholarshipCost = (age < graduationAge + inputs.scholarshipYears) ? (inputs.scholarshipDebt / inputs.scholarshipYears) : 0;
            
            let annualEducationCost = 0;
            lifeEvents.filter(e => e.type === 'education').forEach(child => {
                const childAge = age - child.birthAge;
                const track = EDUCATION_TRACKS[child.track];
                if (childAge >= 6 && childAge < 12) annualEducationCost += EDUCATION_COSTS[`${track.stages.elem}_elem`];
                if (childAge >= 12 && childAge < 15) annualEducationCost += EDUCATION_COSTS[`${track.stages.middle}_middle`];
                if (childAge >= 15 && childAge < 18) annualEducationCost += EDUCATION_COSTS[`${track.stages.high}_high`];
                if (childAge >= 18 && childAge < (track.stages.uni === 'uni_private_medical' ? 24 : 22)) annualEducationCost += EDUCATION_COSTS[track.stages.uni];
            });

            let annualLoanPayments = 0;
            activeLoans.forEach(loan => {
                annualLoanPayments += calculateMonthlyPayment(loan.cost, loan.interestRate, loan.loanTerm) * 12;
            });

            const expenseBasedIncomeAfterTax = annualLivingCost + annualScholarshipCost + annualEducationCost + annualLoanPayments + annualRetirementSaving + targetDisposableIncome;
            const expenseBasedIncomePreTax = expenseBasedIncomeAfterTax / AFTER_TAX_RATE;
            const requiredAnnualIncomePreTax = Math.max(peakLoanRequiredIncome, expenseBasedIncomePreTax);
            incomeData.push(Math.round(requiredAnnualIncomePreTax));

            const annualExpenses = annualLivingCost + annualScholarshipCost + annualEducationCost + annualLoanPayments;
            currentAsset += (requiredAnnualIncomePreTax * AFTER_TAX_RATE) - annualExpenses - targetDisposableIncome;
            assetData.push(Math.round(currentAsset));
            
            expenseDetails.push({ living: annualLivingCost, scholarship: annualScholarshipCost, education: annualEducationCost, loans: annualLoanPayments, retirement: annualRetirementSaving, disposable: targetDisposableIncome });
        }

        return { labels, assetData, incomeData, expenseDetails, peakLoanEvent };
    };

    const renderChart = (progressionData) => {
        if (assetChart) assetChart.destroy();
        assetChart = new Chart(chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: progressionData.labels,
                datasets: [{
                    label: 'あなたの予測資産',
                    data: progressionData.assetData,
                    borderColor: '#007aff', backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: true, tension: 0.1, yAxisID: 'y',
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { type: 'linear', display: true, position: 'left', ticks: { callback: (value) => `¥${(value / 1000000).toFixed(1)}百万` } } },
                onClick: (event, elements) => {
                    if (elements.length > 0) showAgeDetailsModal(elements[0].index);
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (context) => `${context[0].label}歳時点`,
                            label: (context) => `予測資産: ¥${(context.parsed.y / 1000000).toFixed(2)}百万`,
                            afterLabel: (context) => {
                                const income = progressionData.incomeData[context.dataIndex];
                                return `\nこの年に必要な年収: ¥${formatNumber(income)}\n（クリックで詳細表示）`;
                            }
                        }
                    }
                }
            }
        });
    };

    const showAgeDetailsModal = (index) => {
        const age = currentProgressionData.labels[index];
        const income = currentProgressionData.incomeData[index];
        const asset = currentProgressionData.assetData[index];
        const expenses = currentProgressionData.expenseDetails[index];
        const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0) - expenses.disposable; // disposable is not an expense
        const disposableIncome = (income * AFTER_TAX_RATE) - totalExpenses;

        modalTitle.textContent = `${age}歳時点の詳細`;
        modalBody.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">📈 この年に必要な年収</span>
                <span class="detail-value income">¥${formatNumber(income)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">💰 年間可処分所得</span>
                <span class="detail-value income">¥${formatNumber(Math.round(disposableIncome))}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">🏦 年末時点の予測資産</span>
                <span class="detail-value">¥${formatNumber(asset)}</span>
            </div>
            <hr>
            <h4>年間支出の内訳 (手取りベース)</h4>
            <div class="detail-item"><span class="detail-label">🏠 住居費</span><span class="detail-value">¥${formatNumber(Math.round(expenses.living))}</span></div>
            <div class="detail-item"><span class="detail-label">🎓 奨学金返済</span><span class="detail-value">¥${formatNumber(Math.round(expenses.scholarship))}</span></div>
            <div class="detail-item"><span class="detail-label">👨‍👩‍👧‍👦 子供の教育費</span><span class="detail-value">¥${formatNumber(Math.round(expenses.education))}</span></div>
            <div class="detail-item"><span class="detail-label">🚗 ローン返済</span><span class="detail-value">¥${formatNumber(Math.round(expenses.loans))}</span></div>
            <div class="detail-item"><span class="detail-label">🌴 老後のための積立</span><span class="detail-value">¥${formatNumber(Math.round(expenses.retirement))}</span></div>
        `;
        modal.style.display = 'flex';
    };

    // --- Helper Functions ---
    const displayLoanRequirement = (peakLoanEvent) => {
        if (!peakLoanEvent) {
            loanRequirementNote.style.display = 'none';
            return;
        }
        const requiredIncome = peakLoanEvent.cost / LOAN_LIMIT_RATIO;
        loanRequirementNote.innerHTML = `
            ⚠️ ローン審査のため、最も条件が厳しいのは <strong>${peakLoanEvent.age}歳</strong> の <strong>「${peakLoanEvent.name}」</strong> のタイミングです。<br>
            この時、審査の目安となる <strong>年収${formatNumber(requiredIncome)}円</strong> がキャリアのどこかの時点で必要になります。
        `;
        loanRequirementNote.style.display = 'block';
    };

    const calculateMonthlyPayment = (principal, annualRate, years) => {
        if (principal <= 0) return 0;
        const monthlyRate = (annualRate / 100) / 12;
        const numberOfPayments = years * 12;
        if (monthlyRate === 0) return principal / numberOfPayments;
        return principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    };

    const readUserInputs = () => ({
        graduationAge: parseInt(document.getElementById('graduation-age').value),
        currentSavings: parseInt(document.getElementById('current-savings').value) * 10000,
        retireAge: parseInt(document.getElementById('retire-age').value),
        scholarshipDebt: parseInt(document.getElementById('scholarship-debt').value) * 10000,
        scholarshipYears: parseInt(document.getElementById('scholarship-years').value),
        graphEndAge: parseInt(document.getElementById('graph-end-age').value),
        targetDisposableIncome: parseInt(document.getElementById('disposable-income').value) * 10000,
    });

    const buildLifeEvents = (inputs) => {
        const lifeEvents = [];
        const housingChoice = housingPlan.value;
        if (housingChoice !== 'none') {
            lifeEvents.push({ age: parseInt(document.getElementById('housing-age').value), ...LIFE_EVENT_DATA.housing[housingChoice], type: 'loan' });
        }
        const carChoice = carPlan.value;
        if (carChoice !== 'none') {
            lifeEvents.push({ age: parseInt(document.getElementById('car-age').value), ...LIFE_EVENT_DATA.car[carChoice], type: 'loan' });
        }
        document.querySelectorAll('.child-plan-group').forEach((el, i) => {
            const birthAge = parseInt(el.querySelector('.child-birth-age').value);
            const eduTrack = el.querySelector('.child-edu-track').value;
            lifeEvents.push({ birthAge: birthAge, track: eduTrack, type: 'education', name: `第${i+1}子: ${EDUCATION_TRACKS[eduTrack].name}` });
        });
        return lifeEvents;
    };

    const displayTimeline = (lifeEvents) => {
        const timelineContainer = document.getElementById('life-event-timeline');
        timelineContainer.innerHTML = '';
        const displayEvents = [];

        lifeEvents.filter(e => e.type === 'loan').forEach(e => displayEvents.push(e));

        lifeEvents.filter(e => e.type === 'education').forEach(child => {
            const track = EDUCATION_TRACKS[child.track];
            const elem_cost = EDUCATION_COSTS[`${track.stages.elem}_elem`] * 6;
            const middle_cost = EDUCATION_COSTS[`${track.stages.middle}_middle`] * 3;
            const high_cost = EDUCATION_COSTS[`${track.stages.high}_high`] * 3;
            const uni_years = track.stages.uni === 'uni_private_medical' ? 6 : 4;
            const uni_cost = EDUCATION_COSTS[track.stages.uni] * uni_years;

            displayEvents.push({ age: child.birthAge + 6, name: `${child.name} (小学校入学)`, cost: elem_cost, type: 'edu_milestone' });
            displayEvents.push({ age: child.birthAge + 12, name: `${child.name} (中学校入学)`, cost: middle_cost, type: 'edu_milestone' });
            displayEvents.push({ age: child.birthAge + 15, name: `${child.name} (高校入学)`, cost: high_cost, type: 'edu_milestone' });
            displayEvents.push({ age: child.birthAge + 18, name: `${child.name} (大学入学)`, cost: uni_cost, type: 'edu_milestone' });
        });

        displayEvents.sort((a, b) => a.age - b.age).forEach(event => {
            const li = document.createElement('li');
            let text = `<strong>${event.age}歳:</strong> ${event.name}`;
            if (event.type === 'loan') {
                const monthlyPayment = calculateMonthlyPayment(event.cost, event.interestRate, event.loanTerm);
                text += ` <span>(ローン借入: ${formatNumber(event.cost)}円 / 月々約${formatNumber(Math.round(monthlyPayment))}円)</span>`;
            } else if (event.type === 'edu_milestone') {
                text += ` <span>(期間総額: 約${formatNumber(event.cost)}円)</span>`;
            }
            li.innerHTML = text;
            timelineContainer.appendChild(li);
        });
    };

    const handlePlanChange = (planElement, ageGroupElement) => {
        ageGroupElement.style.display = planElement.value === 'none' ? 'none' : 'block';
    };

    const renderChildrenPlans = () => {
        const count = parseInt(childrenCount.value);
        childrenPlansContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const childDiv = document.createElement('div');
            childDiv.className = 'child-plan-group';
            let options = '';
            for(const track in EDUCATION_TRACKS) {
                options += `<option value="${track}">${EDUCATION_TRACKS[track].name}</option>`;
            }
            childDiv.innerHTML = `
                <h5>第${i}子</h5>
                <div class="form-group">
                    <label for="child-${i}-birth-age">あなたの年齢</label>
                    <input type="number" id="child-${i}-birth-age" min="22" max="45" value="${28 + (i-1)*2}" class="child-birth-age">
                    <span>歳で誕生</span>
                </div>
                <div class="form-group">
                    <label for="child-${i}-edu-track">教育プラン</label>
                    <select id="child-${i}-edu-track" class="child-edu-track">${options}</select>
                </div>
            `;
            childrenPlansContainer.appendChild(childDiv);
        }
    };

    const formatNumber = (num) => num.toLocaleString();

    // --- Event Listeners ---
    calculateBtn.addEventListener('click', calculateAndDisplayResults);
    housingPlan.addEventListener('change', () => handlePlanChange(housingPlan, document.getElementById('housing-age-group')));
    carPlan.addEventListener('change', () => handlePlanChange(carPlan, document.getElementById('car-age-group')));
    childrenCount.addEventListener('change', renderChildrenPlans);
    modalCloseBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // --- Initial State ---
    renderChildrenPlans();
});