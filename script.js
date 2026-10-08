/**
 * Cash-Flow: Salary & Expense Tracker Module
 * Engineering Sprint 02 - Core Engineering & Logic (Vanilla JavaScript)
 * Author: Harsh Vardhan (Prodesk IT Associate)
 */

'use strict';

(function () {
  // --------------------------------------------------------------------------
  // 1. State Management & Configuration Constants
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'cashflow_state_v2';
  const THEME_STORAGE_KEY = 'cashflow_theme_mode';

  // Fallback exchange rates against base INR in case external API is unreachable
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

  const CATEGORY_ICONS = {
    Housing: '🏠',
    Food: '🍔',
    Utilities: '💡',
    Transportation: '🚗',
    Entertainment: '🎬',
    Healthcare: '💊',
    Education: '📚',
    Shopping: '🛍️',
    Other: '📁'
  };

  // Primary reactive application state
  const state = {
    salary: 0, // Stored internally in base currency (INR)
    expenses: [], // Array of { id, name, amount (in base INR), category, timestamp }
    currentCurrency: 'INR',
    rates: { ...DEFAULT_RATES },
    chartInstance: null,
    searchFilter: ''
  };

  // --------------------------------------------------------------------------
  // 2. DOM Elements Cache
  // --------------------------------------------------------------------------
  const DOM = {
    // Top Navigation & Actions
    currencySelect: document.getElementById('currencySelect'),
    rateStatusIndicator: document.getElementById('rateStatusIndicator'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    resetDataBtn: document.getElementById('resetDataBtn'),

    // Threshold Alert Banner
    thresholdAlertBanner: document.getElementById('thresholdAlertBanner'),
    alertTitle: document.getElementById('alertTitle'),
    alertMessage: document.getElementById('alertMessage'),

    // KPI Displays
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

    // Forms
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

    // Expenses Ledger
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

  /**
   * Converts a base INR amount to currently selected currency
   * @param {number} baseAmount - Value in INR
   * @returns {number}
   */
  function convertFromBase(baseAmount) {
    const rate = state.rates[state.currentCurrency] || 1;
    return baseAmount * rate;
  }

  /**
   * Converts an amount in currently selected currency back to base INR
   * @param {number} displayedAmount - Value in currently active currency
   * @returns {number}
   */
  function convertToBase(displayedAmount) {
    const rate = state.rates[state.currentCurrency] || 1;
    return displayedAmount / rate;
  }

  /**
   * Format number into currency string with commas and 2 decimal points
   * @param {number} value
   * @returns {string}
   */
  function formatMoney(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // --------------------------------------------------------------------------
  // 4. LocalStorage Persistence (Phase 2 Requirement)
  // --------------------------------------------------------------------------

  /**
   * Serializes and saves state to localStorage
   */
  function saveStateToStorage() {
    try {
      const payload = {
        salary: state.salary,
        expenses: state.expenses,
        currentCurrency: state.currentCurrency
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      showToast('Error saving state to local storage', 'danger');
    }
  }

  /**
   * Retrieves and rehydrates state from localStorage
   */
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
      console.warn('LocalStorage data corrupted or missing, resetting defaults:', err);
    }
  }

  // --------------------------------------------------------------------------
  // 5. External API: Currency Conversion (Phase 3 Requirement)
  // --------------------------------------------------------------------------

  /**
   * Fetches latest live exchange rates from Frankfurter API (Keyless free endpoint)
   */
  async function fetchLiveExchangeRates() {
    try {
      if (DOM.rateStatusIndicator) {
        DOM.rateStatusIndicator.textContent = 'Updating...';
        DOM.rateStatusIndicator.style.color = '#f59e0b';
      }

      // Frankfurter API endpoint with base INR
      const response = await fetch('https://api.frankfurter.app/latest?from=INR');
      if (!response.ok) {
        throw new Error(`API status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.rates) {
        state.rates = {
          INR: 1.0,
          USD: data.rates.USD || DEFAULT_RATES.USD,
          EUR: data.rates.EUR || DEFAULT_RATES.EUR,
          GBP: data.rates.GBP || DEFAULT_RATES.GBP
        };
        if (DOM.rateStatusIndicator) {
          DOM.rateStatusIndicator.textContent = '• Live API';
          DOM.rateStatusIndicator.style.color = '#10b981';
          DOM.rateStatusIndicator.title = `Rates fetched from Frankfurter at ${new Date().toLocaleTimeString()}`;
        }
      }
    } catch (err) {
      console.warn('Using offline fallback rates due to API fetch failure:', err);
      state.rates = { ...DEFAULT_RATES };
      if (DOM.rateStatusIndicator) {
        DOM.rateStatusIndicator.textContent = '• Offline Fallback';
        DOM.rateStatusIndicator.style.color = '#94a3b8';
        DOM.rateStatusIndicator.title = 'Offline rates active';
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. Real-Time State Calculations & DOM Render (Phase 1, 2, 3)
  // --------------------------------------------------------------------------

  /**
   * Recalculates all balances, updates KPI cards, triggers threshold alerts,
   * re-renders list, and syncs Chart.js visualization.
   */
  function renderApp() {
    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';

    // 1. Update all currency symbols and active currency labels across DOM
    DOM.currencySymbols.forEach(el => { el.textContent = symbol; });
    DOM.activeCurrencyLabels.forEach(el => { el.textContent = state.currentCurrency; });

    // 2. Compute Core Mathematical Logic (Values in base INR)
    const totalSalaryINR = Number(state.salary) || 0;
    const totalExpensesINR = state.expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const remainingBalanceINR = totalSalaryINR - totalExpensesINR;

    // Converted values for active display
    const displayedSalary = convertFromBase(totalSalaryINR);
    const displayedExpenses = convertFromBase(totalExpensesINR);
    const displayedBalance = convertFromBase(remainingBalanceINR);

    // 3. Render Salary KPI Card
    DOM.totalSalaryDisplay.textContent = formatMoney(displayedSalary);
    DOM.salaryStatusTag.textContent = totalSalaryINR > 0 ? 'Active Budget' : 'Zero Set';

    // 4. Render Expenses KPI Card
    DOM.totalExpensesDisplay.textContent = formatMoney(displayedExpenses);
    const expensePercent = totalSalaryINR > 0 ? ((totalExpensesINR / totalSalaryINR) * 100).toFixed(1) : 0;
    DOM.expensePercentageTag.textContent = `${expensePercent}% of Salary`;
    DOM.expenseCountHint.textContent = `${state.expenses.length} transaction${state.expenses.length === 1 ? '' : 's'}`;

    // 5. Render Remaining Balance KPI Card
    DOM.remainingBalanceDisplay.textContent = formatMoney(displayedBalance);
    const remainingPercent = totalSalaryINR > 0 ? ((remainingBalanceINR / totalSalaryINR) * 100).toFixed(1) : 0;
    DOM.balanceStatusTag.textContent = `${remainingPercent}% Left`;

    // 6. Savings Rate KPI Card
    let savingsRate = 0;
    if (totalSalaryINR > 0) {
      savingsRate = Math.max(0, Math.min(100, Math.round((remainingBalanceINR / totalSalaryINR) * 100)));
    }
    DOM.savingsRateDisplay.textContent = `${savingsRate}%`;
    DOM.savingsProgressBar.style.width = `${savingsRate}%`;

    // ------------------------------------------------------------------------
    // Phase 3: Critical Threshold Warning Logic
    // If Remaining Balance drops below 10% of Total Salary -> Warning Alert
    // ------------------------------------------------------------------------
    const thresholdAmountINR = totalSalaryINR * 0.10;
    const isBelowTenPercent = totalSalaryINR > 0 && remainingBalanceINR < thresholdAmountINR && remainingBalanceINR >= 0;
    const isDeficit = totalSalaryINR > 0 && remainingBalanceINR < 0;

    if (isDeficit) {
      // Deficit state (< 0)
      DOM.remainingBalanceCard.classList.add('threshold-critical');
      DOM.thresholdAlertBanner.classList.remove('d-none');
      DOM.alertTitle.textContent = '🚨 Critical Alert: Budget Deficit!';
      DOM.alertMessage.textContent = `Your total expenses exceed your salary by ${symbol}${formatMoney(Math.abs(displayedBalance))}. Please reduce expenses immediately.`;
      DOM.balanceRatioHint.textContent = 'Deficit: Over Budget';
      DOM.savingsStatusHint.textContent = 'Deficit: 0% Saved';
      DOM.savingsProgressBar.style.background = 'var(--danger-500)';
    } else if (isBelowTenPercent) {
      // Below 10% threshold
      DOM.remainingBalanceCard.classList.add('threshold-critical');
      DOM.thresholdAlertBanner.classList.remove('d-none');
      DOM.alertTitle.textContent = '⚠️ Critical Warning: Low Balance!';
      DOM.alertMessage.textContent = `Your remaining balance (${remainingPercent}%) has dropped below 10% of total salary (${symbol}${formatMoney(convertFromBase(thresholdAmountINR))}).`;
      DOM.balanceRatioHint.textContent = 'Critical (< 10% Remaining)';
      DOM.savingsStatusHint.textContent = 'Attention required';
      DOM.savingsProgressBar.style.background = 'var(--warning-500)';
    } else {
      // Normal healthy balance
      DOM.remainingBalanceCard.classList.remove('threshold-critical');
      DOM.thresholdAlertBanner.classList.add('d-none');
      DOM.balanceRatioHint.textContent = totalSalaryINR > 0 ? 'Healthy Budget' : 'No Active Budget';
      DOM.savingsStatusHint.textContent = totalSalaryINR > 0 ? 'Optimal financial status' : 'Enter salary to begin';
      DOM.savingsProgressBar.style.background = 'linear-gradient(90deg, var(--success-500), #22c55e)';
    }

    // 7. Update Chart & Metrics Pill
    DOM.legendBalanceVal.textContent = `${symbol}${formatMoney(Math.max(0, displayedBalance))}`;
    DOM.legendExpensesVal.textContent = `${symbol}${formatMoney(displayedExpenses)}`;
    updateChart(Math.max(0, displayedBalance), displayedExpenses, symbol);

    // 8. Render Expense List
    renderExpenseList();
  }

  // --------------------------------------------------------------------------
  // 7. Dynamic DOM List Rendering & Delete Operations (Phase 1 & Phase 2)
  // --------------------------------------------------------------------------

  /**
   * Renders the dynamic list of logged expenses with delete buttons
   */
  function renderExpenseList() {
    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
    const filter = (state.searchFilter || '').trim().toLowerCase();

    // Filter items based on user search input
    const filteredExpenses = state.expenses.filter(item => {
      if (!filter) return true;
      return (
        item.name.toLowerCase().includes(filter) ||
        (item.category && item.category.toLowerCase().includes(filter))
      );
    });

    DOM.expensesCounter.textContent = state.expenses.length;

    // Clear current list content
    DOM.expensesList.innerHTML = '';

    if (filteredExpenses.length === 0) {
      DOM.emptyExpensesState.classList.remove('d-none');
      if (filter && state.expenses.length > 0) {
        DOM.emptyExpensesState.querySelector('.empty-state-title').textContent = 'No matching expenses';
        DOM.emptyExpensesState.querySelector('.empty-state-text').textContent = `No results found for "${filter}". Clear your search query to see all records.`;
      } else {
        DOM.emptyExpensesState.querySelector('.empty-state-title').textContent = 'No expenses logged yet';
        DOM.emptyExpensesState.querySelector('.empty-state-text').textContent = 'Input your expenses in the form on the left to track your spending and see real-time balance calculations.';
      }
      return;
    }

    DOM.emptyExpensesState.classList.add('d-none');

    // Create DOM elements dynamically using document.createElement
    filteredExpenses.forEach(expense => {
      const li = document.createElement('li');
      li.className = 'expense-item';
      li.setAttribute('data-id', expense.id);

      // Converted amount
      const convertedAmt = convertFromBase(expense.amount);
      const icon = CATEGORY_ICONS[expense.category] || '📁';
      const formattedDate = expense.date
        ? new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent';

      // Left column
      const leftCol = document.createElement('div');
      leftCol.className = 'expense-item-left';

      const catIcon = document.createElement('div');
      catIcon.className = 'expense-category-icon';
      catIcon.setAttribute('aria-hidden', 'true');
      catIcon.textContent = icon;

      const details = document.createElement('div');
      details.className = 'expense-details';

      const title = document.createElement('span');
      title.className = 'expense-title';
      title.textContent = expense.name;

      const meta = document.createElement('span');
      meta.className = 'expense-meta';
      meta.textContent = `${expense.category || 'Other'} • ${formattedDate}`;

      details.appendChild(title);
      details.appendChild(meta);
      leftCol.appendChild(catIcon);
      leftCol.appendChild(details);

      // Right column
      const rightCol = document.createElement('div');
      rightCol.className = 'expense-item-right';

      const amountSpan = document.createElement('span');
      amountSpan.className = 'expense-amount-display';
      amountSpan.textContent = `-${symbol}${formatMoney(convertedAmt)}`;

      // Delete Action Button (Phase 2 Requirement)
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-trash';
      deleteBtn.setAttribute('title', `Delete ${expense.name}`);
      deleteBtn.setAttribute('aria-label', `Delete ${expense.name} expense`);
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

      // Event listener for deletion
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

  /**
   * Handles deleting an expense from state, updating localStorage and re-rendering
   * @param {string} expenseId
   * @param {string} expenseName
   */
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
  // 8. Chart.js Data Visualization (Phase 2 Requirement)
  // --------------------------------------------------------------------------

  /**
   * Creates or updates the dynamic Chart.js Pie Chart ("Remaining Balance vs Total Expenses")
   * Lifecycle handled properly with .destroy() to prevent canvas duplication (FAQ #8)
   */
  function updateChart(remainingBalance, totalExpenses, symbol) {
    if (!window.Chart || !DOM.balanceChartCanvas) return;

    // Check if there is data to display
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

    // If chart instance already exists, safely destroy it before recreating (FAQ #8)
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
            '#10b981', // Emerald for balance
            '#f43f5e'  // Rose for expenses
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
                size: 12,
                weight: '500'
              },
              padding: 14
            }
          },
          tooltip: {
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
          duration: 400
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Form Submissions & Strict Validations (Phase 1 Requirement)
  // --------------------------------------------------------------------------

  /**
   * Validates and processes Total Salary Form submission
   */
  function handleSalarySubmit(e) {
    e.preventDefault();
    const rawValue = DOM.salaryInput.value.trim();

    // Prevent execution and show error state if input is empty or invalid (Phase 1)
    if (!rawValue) {
      showFieldError(DOM.salaryInput, DOM.salaryErrorMsg, 'Salary input cannot be empty.');
      return;
    }

    const parsedSalary = parseFloat(rawValue);

    // Prevent negative or zero salary
    if (isNaN(parsedSalary) || !Number.isFinite(parsedSalary) || parsedSalary <= 0) {
      showFieldError(DOM.salaryInput, DOM.salaryErrorMsg, 'Please enter a valid positive salary amount.');
      return;
    }

    clearFieldError(DOM.salaryInput, DOM.salaryErrorMsg);

    // Convert input value back to base INR before storing
    const salaryInBaseINR = convertToBase(parsedSalary);
    state.salary = salaryInBaseINR;

    // Persist to localStorage and re-render
    saveStateToStorage();
    renderApp();

    DOM.salaryInput.value = '';
    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
    showToast(`Salary set to ${symbol}${formatMoney(parsedSalary)}`, 'success');
  }

  /**
   * Validates and processes Add Expense Form submission
   */
  function handleExpenseSubmit(e) {
    e.preventDefault();

    const nameValue = DOM.expenseNameInput.value.trim();
    const rawAmount = DOM.expenseAmountInput.value.trim();
    const categoryValue = DOM.expenseCategorySelect.value || 'Other';

    let hasError = false;

    // Validation: Expense Name
    if (!nameValue) {
      showFieldError(DOM.expenseNameInput, DOM.expenseNameErrorMsg, 'Expense name cannot be empty.');
      hasError = true;
    } else {
      clearFieldError(DOM.expenseNameInput, DOM.expenseNameErrorMsg);
    }

    // Validation: Expense Amount
    if (!rawAmount) {
      showFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg, 'Expense amount cannot be empty.');
      hasError = true;
    } else {
      const parsedAmount = parseFloat(rawAmount);
      if (isNaN(parsedAmount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        showFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg, 'Please enter a valid positive expense amount.');
        hasError = true;
      } else {
        clearFieldError(DOM.expenseAmountInput, DOM.expenseAmountErrorMsg);
      }
    }

    if (hasError) return;

    const parsedAmount = parseFloat(rawAmount);
    // Convert to base INR for internal storage
    const amountInBaseINR = convertToBase(parsedAmount);

    // Construct new Expense Object
    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: nameValue,
      amount: amountInBaseINR,
      category: categoryValue,
      date: new Date().toISOString()
    };

    // Prepend new expense so newest is at the top
    state.expenses.unshift(newExpense);

    // Persist and re-render
    saveStateToStorage();
    renderApp();

    // Reset inputs
    DOM.expenseNameInput.value = '';
    DOM.expenseAmountInput.value = '';
    DOM.expenseNameInput.focus();

    const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
    showToast(`Added expense: "${nameValue}" (${symbol}${formatMoney(parsedAmount)})`, 'success');
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
  // 10. Report Generation: jsPDF Export (Phase 3 Stretch Goal)
  // --------------------------------------------------------------------------

  /**
   * Generates and downloads a branded PDF Financial Statement
   */
  function exportPdfReport() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('PDF generator library is initializing. Please retry in a moment.', 'danger');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const symbol = CURRENCY_SYMBOLS[state.currentCurrency] || '₹';
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

      // 1. Header Banner
      doc.setFillColor(79, 70, 229); // Brand Indigo
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Cash-Flow Statement', 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Salary & Expense Tracker Report | Generated: ${today}`, 14, 28);

      // 2. Summary Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 14, 48);

      const summaryTableData = [
        ['Total Salary', `${currencyCode} ${formatMoney(dispSalary)}`],
        ['Total Expenses', `${currencyCode} ${formatMoney(dispExpenses)}`],
        ['Remaining Balance', `${currencyCode} ${formatMoney(dispBalance)}`],
        ['Savings Rate', `${totalSalaryINR > 0 ? Math.round((remainingBalanceINR / totalSalaryINR) * 100) : 0}%`],
        ['Status', remainingBalanceINR < 0 ? 'Deficit (Over Budget)' : (remainingBalanceINR < totalSalaryINR * 0.1 ? 'Critical Low Balance' : 'Healthy Budget')]
      ];

      doc.autoTable({
        startY: 52,
        head: [['Metric', 'Value']],
        body: summaryTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 3.5
        },
        margin: { left: 14, right: 14 }
      });

      // 3. Itemized Expenses Table
      const nextY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Itemized Expenses Ledger (${state.expenses.length} records)`, 14, nextY);

      const expenseRows = state.expenses.map((item, index) => {
        const itemConverted = convertFromBase(item.amount);
        const itemDate = item.date ? new Date(item.date).toLocaleDateString() : '-';
        return [
          index + 1,
          item.name,
          item.category || 'Other',
          itemDate,
          `${currencyCode} ${formatMoney(itemConverted)}`
        ];
      });

      if (expenseRows.length === 0) {
        expenseRows.push(['-', 'No expenses logged', '-', '-', `${currencyCode} 0.00`]);
      }

      doc.autoTable({
        startY: nextY + 4,
        head: [['#', 'Expense Name', 'Category', 'Date Logged', 'Amount']],
        body: expenseRows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3
        },
        margin: { left: 14, right: 14 }
      });

      // 4. Footer Note
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by Cash-Flow • Prodesk IT Internship Sprint 02 • Harsh Vardhan', 14, pageHeight - 10);

      const fileName = `CashFlow_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      showToast('Downloaded PDF Report successfully!', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Failed to export PDF statement.', 'danger');
    }
  }

  // --------------------------------------------------------------------------
  // 11. Theme & Reset Management
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

    // Re-render chart to adapt colors
    renderApp();
  }

  function updateThemeIcon(theme) {
    if (!DOM.themeIcon) return;
    if (theme === 'theme-dark') {
      DOM.themeIcon.className = 'fa-solid fa-sun';
    } else {
      DOM.themeIcon.className = 'fa-solid fa-moon';
    }
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
    showToast('All state and LocalStorage data reset.', 'info');
  }

  // --------------------------------------------------------------------------
  // 12. Toast Feedback System
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
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // --------------------------------------------------------------------------
  // 13. Application Initialization & Event Wiring
  // --------------------------------------------------------------------------

  async function init() {
    // 1. Initialize Theme
    initTheme();

    // 2. Load Persisted State from LocalStorage (Phase 2)
    loadStateFromStorage();

    // 3. Attach Event Listeners
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
        showToast(`Currency changed to ${state.currentCurrency}`, 'info');
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

    // Input error clears on typing
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

    // Modal background click to close
    if (DOM.resetConfirmModal) {
      DOM.resetConfirmModal.addEventListener('click', (e) => {
        if (e.target === DOM.resetConfirmModal) {
          closeResetModal();
        }
      });
    }

    // 4. Initial Render with stored data
    renderApp();

    // 5. Fetch Live Exchange Rates in background (Phase 3 API)
    await fetchLiveExchangeRates();
    renderApp();
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
