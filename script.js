/**
 * CashFlow Enterprise — Core Engineering & State Engine
 * Sprint 02: Logic & Data Persistence (Vanilla JavaScript)
 * Author: Harsh Vardhan
 */

'use strict';

(function () {
  // --------------------------------------------------------------------------
  // 1. State Configuration & Tokens
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'cashflow_state_prod_v2';
  const THEME_STORAGE_KEY = 'cashflow_theme_mode';

  // Fallback exchange rates against base INR
  const DEFAULT_RATES = {
    INR: 1.0,
    USD: 0.012, // ~1 USD = ~83.33 INR
    EUR: 0.011, // ~1 EUR = ~90.90 INR
    GBP: 0.0095 // ~1 GBP = ~105.26 INR
  };

  const CURRENCY_SYMBOLS = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const CATEGORY_CONFIG = {
    Housing: { icon: 'fa-house', class: 'cat-housing', label: 'Housing & Facilities' },
    Food: { icon: 'fa-utensils', class: 'cat-food', label: 'Food & Dining' },
    Utilities: { icon: 'fa-bolt', class: 'cat-utilities', label: 'Utilities & Bills' },
    Transportation: { icon: 'fa-car-side', class: 'cat-transportation', label: 'Transportation' },
    Entertainment: { icon: 'fa-film', class: 'cat-entertainment', label: 'Entertainment' },
    Healthcare: { icon: 'fa-heart-pulse', class: 'cat-healthcare', label: 'Healthcare' },
    Education: { icon: 'fa-graduation-cap', class: 'cat-education', label: 'Education' },
    Shopping: { icon: 'fa-bag-shopping', class: 'cat-shopping', label: 'Shopping' },
    Other: { icon: 'fa-layer-group', class: 'cat-other', label: 'Miscellaneous' }
  };

  // Primary application state
  const state = {
    salary: 0, // Stored internally in base INR
    expenses: [], // Array of { id, name, amount (in base INR), category, date }
    currentCurrency: 'INR',
    rates: { ...DEFAULT_RATES },
    chartInstance: null,
    searchFilter: ''
  };

  // --------------------------------------------------------------------------
  // 2. DOM Elements Cache
  // --------------------------------------------------------------------------
  const DOM = {
    // Top Navigation & Controls
    currencySelect: document.getElementById('currencySelect'),
    rateStatusIndicator: document.getElementById('rateStatusIndicator'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    resetDataBtn: document.getElementById('resetDataBtn'),

    // Liquidity Risk Alert Banner
    thresholdAlertBanner: document.getElementById('thresholdAlertBanner'),
    alertTitle: document.getElementById('alertTitle'),
    alertMessage: document.getElementById('alertMessage'),

    // KPI Metrics
    totalSalaryDisplay: document.getElementById('totalSalaryDisplay'),
    salaryStatusTag: document.getElementById('salaryStatusTag'),
    totalExpensesDisplay: document.getElementById('totalExpensesDisplay'),
    expensePercentageTag: document.getElementById('expensePercentageTag'),
    expenseCountHint: document.getElementById('expenseCountHint'),
    remainingBalanceDisplay: document.getElementById('remainingBalanceDisplay'),
    remainingBalanceCard: document.getElementById('remainingBalanceCard'),
    balanceCurrencySymbol: document.getElementById('balanceCurrencySymbol'),
    balanceStatusTag: document.getElementById('balanceStatusTag'),
    balanceRatioHint: document.getElementById('balanceRatioHint'),
    savingsRateDisplay: document.getElementById('savingsRateDisplay'),
    savingsProgressBar: document.getElementById('savingsProgressBar'),
    savingsStatusHint: document.getElementById('savingsStatusHint'),

    // Currency Labels
    currencySymbols: document.querySelectorAll('.currency-symbol'),
    activeCurrencyLabels: document.querySelectorAll('.active-currency-label'),

    // Inflow & Outflow Forms
    salaryForm: document.getElementById('salaryForm'),
    salaryInput: document.getElementById('salaryInput'),
    salaryErrorMsg: document.getElementById('salaryErrorMsg'),

    expenseForm: document.getElementById('expenseForm'),
    expenseNameInput: document.getElementById('expenseNameInput'),
    expenseNameErrorMsg: document.getElementById('expenseNameErrorMsg'),
    expenseAmountInput: document.getElementById('expenseAmountInput'),
    expenseAmountErrorMsg: document.getElementById('expenseAmountErrorMsg'),
    expenseCategorySelect: document.getElementById('expenseCategorySelect'),

    // Chart.js Canvas
    balanceChartCanvas: document.getElementById('balanceChart'),
    emptyChartPlaceholder: document.getElementById('emptyChartPlaceholder'),
    legendBalanceVal: document.getElementById('legendBalanceVal'),
    legendExpensesVal: document.getElementById('legendExpensesVal'),

    // Transaction Ledger
    expensesList: document.getElementById('expensesList'),
    emptyExpensesState: document.getElementById('emptyExpensesState'),
    expensesCounter: document.getElementById('expensesCounter'),
    searchExpenseInput: document.getElementById('searchExpenseInput'),

    // Modal & Toast
    resetConfirmModal: document.getElementById('resetConfirmModal'),
    cancelResetBtn: document.getElementById('cancelResetBtn'),
    confirmResetBtn: document.getElementById('confirmResetBtn'),
    toastContainer: document.getElementById('toastContainer')
  };

  // --------------------------------------------------------------------------
  // 3. Mathematical & Formatting Utilities
  // --------------------------------------------------------------------------

  function convertFromBase(baseAmount) {
    const rate = state.rates[state.currentCurrency] || 1;
    return baseAmount * rate;
  }

  function convertToBase(displayedAmount) {
    const rate = state.rates[state.currentCurrency] || 1;
    return displayedAmount / rate;
  }

  function formatMoney(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatTimestamp(isoString) {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      const isToday = new Date().toDateString() === d.toDateString();
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      if (isToday) return `Today, ${timeStr}`;
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return 'Recent';
    }
  }

  // --------------------------------------------------------------------------
  // 4. LocalStorage Persistence (Phase 2 Requirement)
  // --------------------------------------------------------------------------

  function saveStateToStorage() {
    try {
      const payload = {
        salary: state.salary,
        expenses: state.expenses,
        currentCurrency: state.currentCurrency
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('LocalStorage write failure:', err);
      showToast('Error syncing to local cache', 'danger');
    }
  }

  function loadStateFromStorage() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        if (typeof parsed.salary === 'number' && parsed.salary >= 0) {
          state.salary = parsed.salary;
        }
        if (Array.isArray(parsed.expenses)) {
          state.expenses = parsed.expenses;
        }
        if (parsed.currentCurrency && CURRENCY_SYMBOLS[parsed.currentCurrency]) {
          state.currentCurrency = parsed.currentCurrency;
          if (DOM.currencySelect) {
            DOM.currencySelect.value = parsed.currentCurrency;
          }
        }
      }
    } catch (err) {
      console.warn('LocalStorage retrieval fallback:', err);
    }
  }

  // --------------------------------------------------------------------------
  // 5. External API: Currency Conversion (Phase 3 Requirement)
  // --------------------------------------------------------------------------

  async function fetchLiveExchangeRates() {
    try {
      if (DOM.rateStatusIndicator) {
        DOM.rateStatusIndicator.textContent = 'Syncing...';
      }

      const response = await fetch('https://api.frankfurter.app/latest?from=INR');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data && data.rates) {
        state.rates = {
          INR: 1.0,
          USD: data.rates.USD || DEFAULT_RATES.USD,
          EUR: data.rates.EUR || DEFAULT_RATES.EUR,
          GBP: data.rates.GBP || DEFAULT_RATES.GBP
        };
        if (DOM.rateStatusIndicator) {
          DOM.rateStatusIndicator.textContent = 'Live API';
          DOM.rateStatusIndicator.title = `Rates refreshed via Frankfurter API at ${new Date().toLocaleTimeString()}`;
        }
      }
    } catch (err) {
      console.warn('Using offline fallback rates:', err);
      state.rates = { ...DEFAULT_RATES };
      if (DOM.rateStatusIndicator) {
        DOM.rateStatusIndicator.textContent = 'Offline Sync';
        DOM.rateStatusIndicator.title = 'Offline fallback exchange rates active';
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. Real-Time Calculation & View Synchronization
  // --------------------------------------------------------------------------

  function renderApp() {
    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';

    // 1. Sync labels & currency marks
    DOM.currencySymbols.forEach(el => { el.textContent = symbol; });
    DOM.activeCurrencyLabels.forEach(el => { el.textContent = state.currentCurrency; });

    // 2. Perform Mathematical Logic (Base INR)
    const totalSalaryINR = Number(state.salary) || 0;
    const totalExpensesINR = state.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remainingBalanceINR = totalSalaryINR - totalExpensesINR;

    // Display values in active currency
    const dispSalary = convertFromBase(totalSalaryINR);
    const dispExpenses = convertFromBase(totalExpensesINR);
    const dispBalance = convertFromBase(remainingBalanceINR);

    // 3. Render Salary KPI
    DOM.totalSalaryDisplay.textContent = formatMoney(dispSalary);
    DOM.salaryStatusTag.textContent = totalSalaryINR > 0 ? 'Active Allocation' : 'Unallocated';

    // 4. Render Expenses KPI
    DOM.totalExpensesDisplay.textContent = formatMoney(dispExpenses);
    const expensePercent = totalSalaryINR > 0 ? ((totalExpensesINR / totalSalaryINR) * 100).toFixed(1) : 0;
    DOM.expensePercentageTag.textContent = `${expensePercent}% of Inflow`;
    DOM.expenseCountHint.textContent = `${state.expenses.length} transaction${state.expenses.length === 1 ? '' : 's'}`;

    // 5. Render Balance KPI
    DOM.remainingBalanceDisplay.textContent = formatMoney(dispBalance);
    const remainingPercent = totalSalaryINR > 0 ? ((remainingBalanceINR / totalSalaryINR) * 100).toFixed(1) : 0;
    DOM.balanceStatusTag.textContent = `${remainingPercent}% Margin`;

    // 6. Savings Ratio KPI
    let savingsRate = 0;
    if (totalSalaryINR > 0) {
      savingsRate = Math.max(0, Math.min(100, Math.round((remainingBalanceINR / totalSalaryINR) * 100)));
    }
    DOM.savingsRateDisplay.textContent = `${savingsRate}%`;
    DOM.savingsProgressBar.style.width = `${savingsRate}%`;

    // ------------------------------------------------------------------------
    // Critical Threshold Warning Logic (Phase 3 Requirement)
    // If Remaining Balance drops below 10% of Total Salary -> Warning Alert
    // ------------------------------------------------------------------------
    const thresholdAmountINR = totalSalaryINR * 0.10;
    const isBelowTenPercent = totalSalaryINR > 0 && remainingBalanceINR < thresholdAmountINR && remainingBalanceINR >= 0;
    const isDeficit = totalSalaryINR > 0 && remainingBalanceINR < 0;

    if (isDeficit) {
      // Over-budget deficit state (< 0)
      DOM.remainingBalanceCard.classList.add('threshold-critical');
      DOM.thresholdAlertBanner.classList.remove('d-none');
      DOM.alertTitle.textContent = 'Critical Alert: Budget Deficit';
      DOM.alertMessage.textContent = `Outflows exceed income by ${symbol}${formatMoney(Math.abs(dispBalance))}. Immediate spending freeze recommended.`;
      DOM.balanceRatioHint.textContent = 'Deficit State';
      DOM.savingsStatusHint.textContent = '0% Capital Retained';
      DOM.savingsProgressBar.style.backgroundColor = 'var(--rose-600)';
    } else if (isBelowTenPercent) {
      // Less than 10% safety buffer
      DOM.remainingBalanceCard.classList.add('threshold-critical');
      DOM.thresholdAlertBanner.classList.remove('d-none');
      DOM.alertTitle.textContent = 'Liquidity Buffer Warning (< 10%)';
      DOM.alertMessage.textContent = `Remaining balance (${remainingPercent}%) is under the 10% liquidity buffer (${symbol}${formatMoney(convertFromBase(thresholdAmountINR))}). Discretionary spending halted.`;
      DOM.balanceRatioHint.textContent = 'Buffer Depleted (< 10%)';
      DOM.savingsStatusHint.textContent = 'Low reserve alert';
      DOM.savingsProgressBar.style.backgroundColor = 'var(--amber-500)';
    } else {
      // Healthy surplus
      DOM.remainingBalanceCard.classList.remove('threshold-critical');
      DOM.thresholdAlertBanner.classList.add('d-none');
      DOM.balanceRatioHint.textContent = totalSalaryINR > 0 ? 'Surplus Reserve' : 'No Allocation';
      DOM.savingsStatusHint.textContent = totalSalaryINR > 0 ? 'Stable capital retention' : 'Configure monthly income';
      DOM.savingsProgressBar.style.backgroundColor = 'var(--emerald-600)';
    }

    // 7. Update Chart & Readout Pills
    DOM.legendBalanceVal.textContent = `${symbol}${formatMoney(Math.max(0, dispBalance))}`;
    DOM.legendExpensesVal.textContent = `${symbol}${formatMoney(dispExpenses)}`;
    updateChart(Math.max(0, dispBalance), dispExpenses, symbol);

    // 8. Render Transaction Table
    renderExpenseList();
  }

  // --------------------------------------------------------------------------
  // 7. Dynamic DOM Transaction Ledger & Deletes (Phase 1 & Phase 2)
  // --------------------------------------------------------------------------

  function renderExpenseList() {
    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
    const filter = (state.searchFilter || '').trim().toLowerCase();

    const filteredExpenses = state.expenses.filter(item => {
      if (!filter) return true;
      return (
        item.name.toLowerCase().includes(filter) ||
        (item.category && item.category.toLowerCase().includes(filter))
      );
    });

    DOM.expensesCounter.textContent = state.expenses.length;
    DOM.expensesList.innerHTML = '';

    if (filteredExpenses.length === 0) {
      DOM.emptyExpensesState.classList.remove('d-none');
      if (filter && state.expenses.length > 0) {
        DOM.emptyExpensesState.querySelector('.empty-title').textContent = 'No matching transactions';
        DOM.emptyExpensesState.querySelector('.empty-desc').textContent = `No ledger entries found matching "${filter}". Clear query to view all records.`;
      } else {
        DOM.emptyExpensesState.querySelector('.empty-title').textContent = 'No transactions recorded';
        DOM.emptyExpensesState.querySelector('.empty-desc').textContent = 'Use the Log Outflow form to add expenses. Transactions will be logged with automated timestamps and persistent state.';
      }
      return;
    }

    DOM.emptyExpensesState.classList.add('d-none');

    filteredExpenses.forEach(expense => {
      const li = document.createElement('li');
      li.className = 'ledger-row';
      li.setAttribute('data-id', expense.id);

      const convertedAmt = convertFromBase(expense.amount);
      const catConfig = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.Other;
      const dateText = formatTimestamp(expense.date);

      // Left Content
      const leftCol = document.createElement('div');
      leftCol.className = 'row-left';

      const catBadge = document.createElement('div');
      catBadge.className = `cat-badge ${catConfig.class}`;
      catBadge.setAttribute('aria-hidden', 'true');
      catBadge.innerHTML = `<i class="fa-solid ${catConfig.icon}"></i>`;

      const descBox = document.createElement('div');
      descBox.className = 'row-desc';

      const title = document.createElement('span');
      title.className = 'row-title';
      title.textContent = expense.name;

      const meta = document.createElement('span');
      meta.className = 'row-meta';
      meta.textContent = `${catConfig.label} • ${dateText}`;

      descBox.appendChild(title);
      descBox.appendChild(meta);
      leftCol.appendChild(catBadge);
      leftCol.appendChild(descBox);

      // Right Content
      const rightCol = document.createElement('div');
      rightCol.className = 'row-right';

      const amountSpan = document.createElement('span');
      amountSpan.className = 'row-sum';
      amountSpan.textContent = `-${symbol}${formatMoney(convertedAmt)}`;

      // Delete Button (Phase 2 Requirement)
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-remove';
      deleteBtn.setAttribute('title', `Delete ${expense.name}`);
      deleteBtn.setAttribute('aria-label', `Delete ${expense.name} transaction`);
      deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';

      deleteBtn.addEventListener('click', () => {
        handleDeleteExpense(expense.id, expense.name);
      });

      rightCol.appendChild(amountSpan);
      rightCol.appendChild(deleteBtn);

      li.appendChild(leftCol);
      li.appendChild(rightCol);

      DOM.expensesList.appendChild(li);
    });
  }

  function handleDeleteExpense(expenseId, expenseName) {
    const prevCount = state.expenses.length;
    state.expenses = state.expenses.filter(item => item.id !== expenseId);

    if (state.expenses.length < prevCount) {
      saveStateToStorage();
      renderApp();
      showToast(`Removed "${expenseName}"`, 'info');
    }
  }

  // --------------------------------------------------------------------------
  // 8. Chart.js Visualization Engine (Phase 2 Requirement)
  // --------------------------------------------------------------------------

  function updateChart(remainingBalance, totalExpenses, symbol) {
    if (!window.Chart || !DOM.balanceChartCanvas) return;

    const hasData = state.salary > 0 || state.expenses.length > 0;
    if (!hasData) {
      if (state.chartInstance) {
        state.chartInstance.destroy();
        state.chartInstance = null;
      }
      DOM.balanceChartCanvas.classList.add('d-none');
      DOM.emptyChartPlaceholder.classList.remove('d-none');
      return;
    }

    DOM.balanceChartCanvas.classList.remove('d-none');
    DOM.emptyChartPlaceholder.classList.add('d-none');

    const chartData = [remainingBalance, totalExpenses];
    const isDark = document.body.classList.contains('theme-dark');

    // Destroy existing instance before recreation (Lifecycle FAQ #8)
    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }

    const ctx = DOM.balanceChartCanvas.getContext('2d');
    state.chartInstance = new window.Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Remaining Balance', 'Total Expenses'],
        datasets: [{
          data: chartData,
          backgroundColor: [
            '#059669', // Emerald for Remaining Balance
            '#e11d48'  // Rose for Total Expenses
          ],
          borderColor: isDark ? '#111827' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#cbd5e1' : '#475569',
              font: {
                family: 'Inter',
                size: 11,
                weight: '500'
              },
              boxWidth: 10,
              boxHeight: 10,
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#0f172a',
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const val = context.raw || 0;
                return ` ${label}: ${symbol}${formatMoney(val)}`;
              }
            }
          }
        },
        animation: {
          duration: 350
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Input Form Handlers & Validations (Phase 1 Requirement)
  // --------------------------------------------------------------------------

  function handleSalarySubmit(e) {
    e.preventDefault();
    const rawValue = DOM.salaryInput.value.trim();

    if (!rawValue) {
      showFieldError(DOM.salaryInput, DOM.salaryErrorMsg, 'Salary value is required.');
      return;
    }

    const parsedSalary = parseFloat(rawValue);

    if (isNaN(parsedSalary) || !Number.isFinite(parsedSalary) || parsedSalary <= 0) {
      showFieldError(DOM.salaryInput, DOM.salaryErrorMsg, 'Please enter a valid positive salary amount.');
      return;
    }

    clearFieldError(DOM.salaryInput, DOM.salaryErrorMsg);

    const salaryInBaseINR = convertToBase(parsedSalary);
    state.salary = salaryInBaseINR;

    saveStateToStorage();
    renderApp();

    DOM.salaryInput.value = '';
    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
    showToast(`Monthly income allocated: ${symbol}${formatMoney(parsedSalary)}`, 'success');
  }

  function handleExpenseSubmit(e) {
    e.preventDefault();

    const nameValue = DOM.expenseNameInput.value.trim();
    const rawAmount = DOM.expenseAmountInput.value.trim();
    const categoryValue = DOM.expenseCategorySelect.value || 'Other';

    let hasError = false;

    // Validate Expense Name
    if (!nameValue) {
      showFieldError(DOM.expenseNameInput, DOM.expenseNameErrorMsg, 'Description cannot be empty.');
      hasError = true;
    } else {
      clearFieldError(DOM.expenseNameInput, DOM.expenseNameErrorMsg);
    }

    // Validate Expense Amount
    if (!rawAmount) {
      showFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg, 'Amount is required.');
      hasError = true;
    } else {
      const parsedAmount = parseFloat(rawAmount);
      if (isNaN(parsedAmount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        showFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg, 'Enter a valid positive number.');
        hasError = true;
      } else {
        clearFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg);
      }
    }

    if (hasError) return;

    const parsedAmount = parseFloat(rawAmount);
    const amountInBaseINR = convertToBase(parsedAmount);

    const newExpense = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: nameValue,
      amount: amountInBaseINR,
      category: categoryValue,
      date: new Date().toISOString()
    };

    state.expenses.unshift(newExpense);

    saveStateToStorage();
    renderApp();

    DOM.expenseNameInput.value = '';
    DOM.expenseAmountInput.value = '';
    DOM.expenseNameInput.focus();

    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
    showToast(`Logged outflow: "${nameValue}" (${symbol}${formatMoney(parsedAmount)})`, 'success');
  }

  function showFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('input-invalid');
    if (errorEl) {
      errorEl.classList.remove('d-none');
      const span = errorEl.querySelector('span');
      if (span) span.textContent = message;
    }
  }

  function clearFieldError(inputEl, errorEl) {
    inputEl.classList.remove('input-invalid');
    if (errorEl) {
      errorEl.classList.add('d-none');
    }
  }

  // --------------------------------------------------------------------------
  // 10. Financial Statement PDF Generator (Phase 3 Requirement)
  // --------------------------------------------------------------------------

  function exportPdfReport() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('PDF compilation library is loading. Retry in a moment.', 'danger');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const currencyCode = state.currentCurrency;
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const totalSalaryINR = Number(state.salary) || 0;
      const totalExpensesINR = state.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const remainingBalanceINR = totalSalaryINR - totalExpensesINR;

      const dispSalary = convertFromBase(totalSalaryINR);
      const dispExpenses = convertFromBase(totalExpensesINR);
      const dispBalance = convertFromBase(remainingBalanceINR);

      // Header Block
      doc.setFillColor(15, 23, 42); // Enterprise Navy
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CashFlow Financial Statement', 14, 20);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Certified Client-Side Treasury Report | Generated: ${today}`, 14, 28);

      // Financial Overview Table
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 14, 48);

      const summaryTableData = [
        ['Allocated Inflow', `${currencyCode} ${formatMoney(dispSalary)}`],
        ['Cumulative Outflows', `${currencyCode} ${formatMoney(dispExpenses)}`],
        ['Net Available Balance', `${currencyCode} ${formatMoney(dispBalance)}`],
        ['Capital Retention Ratio', `${totalSalaryINR > 0 ? Math.round((remainingBalanceINR / totalSalaryINR) * 100) : 0}%`],
        ['Liquidity Status', remainingBalanceINR < 0 ? 'Deficit (Over-budget)' : (remainingBalanceINR < totalSalaryINR * 0.1 ? 'Critical Buffer Warning' : 'Healthy Reserve')]
      ];

      doc.autoTable({
        startY: 52,
        head: [['Metric', 'Figure']],
        body: summaryTableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 3.5 },
        margin: { left: 14, right: 14 }
      });

      // Itemized Outflow Ledger
      const nextY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Itemized Outflow Ledger (${state.expenses.length} records)`, 14, nextY);

      const expenseRows = state.expenses.map((item, index) => {
        const itemConverted = convertFromBase(item.amount);
        const itemDate = item.date ? new Date(item.date).toLocaleDateString() : '-';
        const catLabel = CATEGORY_CONFIG[item.category]?.label || 'Miscellaneous';
        return [
          index + 1,
          item.name,
          catLabel,
          itemDate,
          `${currencyCode} ${formatMoney(itemConverted)}`
        ];
      });

      if (expenseRows.length === 0) {
        expenseRows.push(['-', 'No records logged', '-', '-', `${currencyCode} 0.00`]);
      }

      doc.autoTable({
        startY: nextY + 4,
        head: [['#', 'Merchant / Description', 'Category', 'Date', 'Amount']],
        body: expenseRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      // Footer Note
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('CashFlow Enterprise Module • Client-Side Cryptographic Local Persistence • Harsh Vardhan', 14, pageHeight - 10);

      const fileName = `CashFlow_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      showToast('Certified PDF Statement exported successfully.', 'success');
    } catch (err) {
      console.error('PDF generation failure:', err);
      showToast('Failed to generate PDF statement.', 'danger');
    }
  }

  // --------------------------------------------------------------------------
  // 11. Theme & Reset Handlers
  // --------------------------------------------------------------------------

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'theme-light';
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('theme-light');
    const newTheme = isLight ? 'theme-dark' : 'theme-light';
    document.body.className = newTheme;
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    updateThemeIcon(newTheme);
    renderApp();
  }

  function updateThemeIcon(theme) {
    if (!DOM.themeIcon) return;
    DOM.themeIcon.className = theme === 'theme-dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  function openResetModal() {
    DOM.resetConfirmModal.classList.remove('d-none');
  }

  function closeResetModal() {
    DOM.resetConfirmModal.classList.add('d-none');
  }

  function confirmResetState() {
    state.salary = 0;
    state.expenses = [];
    localStorage.removeItem(STORAGE_KEY);
    closeResetModal();
    renderApp();
    showToast('Ledger and local storage state purged.', 'info');
  }

  // --------------------------------------------------------------------------
  // 12. Interactive Toast Engine
  // --------------------------------------------------------------------------

  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') iconHtml = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'danger') iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';

    toast.innerHTML = `${iconHtml}<span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // --------------------------------------------------------------------------
  // 13. Initialization & Event Binding
  // --------------------------------------------------------------------------

  async function init() {
    initTheme();
    loadStateFromStorage();

    if (DOM.salaryForm) {
      DOM.salaryForm.addEventListener('submit', handleSalarySubmit);
    }
    if (DOM.expenseForm) {
      DOM.expenseForm.addEventListener('submit', handleExpenseSubmit);
    }
    if (DOM.currencySelect) {
      DOM.currencySelect.addEventListener('change', (e) => {
        state.currentCurrency = e.target.value;
        saveStateToStorage();
        renderApp();
        showToast(`Currency shifted to ${state.currentCurrency}`, 'info');
      });
    }
    if (DOM.downloadPdfBtn) {
      DOM.downloadPdfBtn.addEventListener('click', exportPdfReport);
    }
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    }
    if (DOM.resetDataBtn) {
      DOM.resetDataBtn.addEventListener('click', openResetModal);
    }
    if (DOM.cancelResetBtn) {
      DOM.cancelResetBtn.addEventListener('click', closeResetModal);
    }
    if (DOM.confirmResetBtn) {
      DOM.confirmResetBtn.addEventListener('click', confirmResetState);
    }
    if (DOM.searchExpenseInput) {
      DOM.searchExpenseInput.addEventListener('input', (e) => {
        state.searchFilter = e.target.value;
        renderExpenseList();
      });
    }

    if (DOM.salaryInput) {
      DOM.salaryInput.addEventListener('input', () => {
        clearFieldError(DOM.salaryInput, DOM.salaryErrorMsg);
      });
    }
    if (DOM.expenseNameInput) {
      DOM.expenseNameInput.addEventListener('input', () => {
        clearFieldError(DOM.expenseNameInput, DOM.expenseNameErrorMsg);
      });
    }
    if (DOM.expenseAmountInput) {
      DOM.expenseAmountInput.addEventListener('input', () => {
        clearFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg);
      });
    }

    if (DOM.resetConfirmModal) {
      DOM.resetConfirmModal.addEventListener('click', (e) => {
        if (e.target === DOM.resetConfirmModal) closeResetModal();
      });
    }

    renderApp();
    await fetchLiveExchangeRates();
    renderApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
