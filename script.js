let salary = 0;
let expenses = []; 
let currentCurrency =  "INR";
let currencyRates =  { INR: 1,
   USD: 0.012,EUR: 0.011,
GBP: 0.0095
};
const currencySymbols = {
   INR: "₹", 
 USD: "$", 
EUR: "€",
   GBP: "£"
};
const categoryIcons = {
   Housing: "fa-house",
 Food: "fa-utensils",
   Utilities: "fa-bolt",
   Transportation: "fa-car-side",
     Entertainment: "fa-film",
Healthcare: "fa-heart-pulse",
Education: "fa-graduation-cap",
       Shopping: "fa-bag-shopping",
   Other:  "fa-layer-group"
};  const categoryClasses = {
   Housing: "cat-housing",
   Food: "cat-food",
   Utilities: "cat-utilities",
   Transportation: "cat-transportation",
   Entertainment: "cat-entertainment",
   Healthcare: "cat-healthcare",
   Education: "cat-education", 
   Shopping: "cat-shopping",
   Other: "cat-other"
};
let chartInstance = null;
const salaryForm = document.getElementById("salaryForm"); 
const salaryInput = document.getElementById("salaryInput");
const salaryErrorMsg = document.getElementById("salaryErrorMsg");
const totalSalaryDisplay = document.getElementById("totalSalaryDisplay");
     const  expenseForm = document.getElementById("expenseForm");
const expenseNameInput = document.getElementById("expenseNameInput");
  const expenseAmountInput =  document.getElementById("expenseAmountInput");
     const expenseCategorySelect  = document.getElementById("expenseCategorySelect");
     const    expenseNameErrorMsg = document.getElementById("expenseNameErrorMsg");
const   expenseAmountErrorMsg = document.getElementById("expenseAmountErrorMsg");
     const  totalExpensesDisplay = document.getElementById("totalExpensesDisplay");
const remainingBalanceDisplay =   document.getElementById("remainingBalanceDisplay");
       const remainingBalanceCard = document.getElementById("remainingBalanceCard");
 const    savingsRateDisplay   = document.getElementById("savingsRateDisplay");
    const savingsProgressBar = document.getElementById("savingsProgressBar");
  const expensesList = document.getElementById("expensesList");
       const   emptyExpensesState = document.getElementById("emptyExpensesState");
     const  expensesCounter = document.getElementById("expensesCounter");
  const     searchExpenseInput = document.getElementById("searchExpenseInput");
const   thresholdAlertBanner = document.getElementById("thresholdAlertBanner");
   const alertTitle = document.getElementById("alertTitle");
  const alertMessage = document.getElementById("alertMessage");
const  currencySelect   =  document.getElementById("currencySelect");
   const   rateStatusIndicator =   document.getElementById("rateStatusIndicator");
  const  downloadPdfBtn   = document.getElementById("downloadPdfBtn");
const   themeToggleBtn = document.getElementById("themeToggleBtn");
     const themeIcon =  document.getElementById("themeIcon");
const resetDataBtn =  document.getElementById("resetDataBtn");
 const resetConfirmModal  = document.getElementById("resetConfirmModal");
  const cancelResetBtn =  document.getElementById("cancelResetBtn");
    const confirmResetBtn  = document.getElementById("confirmResetBtn");
    const balanceChartCanvas = document.getElementById("balanceChart");
  const emptyChartPlaceholder = document.getElementById("emptyChartPlaceholder");
 const legendBalanceVal = document.getElementById("legendBalanceVal");
const legendExpensesVal = document.getElementById("legendExpensesVal");

function formatNumber(num) {
   num = Number(num);
   if (isNaN(num)) return "0.00";
   return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
   });
}
function convertAmount(inrAmount) {
   const rate = currencyRates[currentCurrency] || 1;
   return inrAmount * rate;
}
function convertToBase(amount) {
   const rate = currencyRates[currentCurrency] || 1;
   return amount / rate;
}

function showToast(msg, type) {
   const container = document.getElementById("toastContainer");
   if (!container) return;

   const toast = document.createElement("div");
   toast.className = "toast toast-" + (type || "info");

   let icon = '<i class="fa-solid fa-circle-info"></i>';
if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
   if (type === "danger") icon = '<i class="fa-solid fa-circle-exclamation"></i>';

   toast.innerHTML = icon + "<span>" + msg + "</span>";
   container.appendChild(toast);

   setTimeout(function () {
      if (toast.parentNode) {
         toast.parentNode.removeChild(toast); } }, 2500);
}

function saveToLocalStorage() {
   const data = {
      salary: salary,
      expenses: expenses,
      currency: currentCurrency
   };
   localStorage.setItem("cashflow_data", JSON.stringify(data));
}

function loadFromLocalStorage() {
   const saved = localStorage.getItem("cashflow_data");
   if (saved) {
      try {
         const parsed = JSON.parse(saved);
         if (typeof parsed.salary === "number") salary = parsed.salary;
  if (Array.isArray(parsed.expenses)) expenses = parsed.expenses;
         if (parsed.currency && currencySymbols[parsed.currency]) {
        currentCurrency = parsed.currency;
            currencySelect.value = currentCurrency;
         }
      } catch (e) {
         console.log(e);}
}
}
async function fetchCurrencyRates() {
   try {
      if (rateStatusIndicator) {
         rateStatusIndicator.textContent = "Updating...";
      }
 const res = await fetch("https://api.frankfurter.app/latest?from=INR");
      const data = await res.json();
      if (data && data.rates) {
         currencyRates.INR = 1;
currencyRates.USD  = data.rates.USD || 0.012;
         currencyRates.EUR = data.rates.EUR || 0.011;
 currencyRates.GBP = data.rates.GBP || 0.0095;
         if (rateStatusIndicator) {
            rateStatusIndicator.textContent = "Live API";
         }
      }
   } catch (err) {
      if (rateStatusIndicator) {
         rateStatusIndicator.textContent = "Offline";
      }
   }
}

function render() {
 const symbol = currencySymbols[currentCurrency] || "₹";

 document.querySelectorAll(".currency-symbol").forEach(function (el) {
    el.textContent = symbol; });
  document.querySelectorAll(".active-currency-label").forEach(function (el) {
   el.textContent = currentCurrency; });

   let totalExpensesINR = 0;
 for (let i = 0; i < expenses.length; i++) {
     totalExpensesINR += expenses[i].amount;
 }
 const remainingBalanceINR = salary - totalExpensesINR;

  const dispSalary = convertAmount(salary);
  const dispExpenses = convertAmount(totalExpensesINR);
 const dispBalance = convertAmount(remainingBalanceINR);

 totalSalaryDisplay.textContent = formatNumber(dispSalary);
   totalExpensesDisplay.textContent = formatNumber(dispExpenses);
 remainingBalanceDisplay.textContent = formatNumber(dispBalance);

   const expensePercentageTag = document.getElementById("expensePercentageTag");
 const expenseCountHint = document.getElementById("expenseCountHint");
   const balanceStatusTag = document.getElementById("balanceStatusTag");

   if (salary > 0) {
      const expPercent = ((totalExpensesINR / salary) * 100).toFixed(1);
   const balPercent = ((remainingBalanceINR / salary) * 100).toFixed(1);
    if (expensePercentageTag) expensePercentageTag.textContent = expPercent + "% of Salary";
      if (balanceStatusTag) balanceStatusTag.textContent = balPercent + "% Left";
 } else {
      if (expensePercentageTag) expensePercentageTag.textContent = "0% of Salary";
    if (balanceStatusTag) balanceStatusTag.textContent = "0% Left";
   }

  if (expenseCountHint) {
     expenseCountHint.textContent = expenses.length + (expenses.length === 1 ? " expense" : " expenses");
  }

  let savings = 0;
  if (salary > 0) {
     savings = Math.max(0, Math.min(100, Math.round((remainingBalanceINR / salary) * 100)));
  }
   savingsRateDisplay.textContent = savings + "%";
 savingsProgressBar.style.width = savings + "%";

 const tenPercentLimit = salary * 0.10;
   if (salary > 0 && remainingBalanceINR < 0) {
      remainingBalanceCard.classList.add("threshold-critical");
     thresholdAlertBanner.classList.remove("d-none");
    alertTitle.textContent = "Alert: Budget Deficit!";
      alertMessage.textContent = "Total expenses have exceeded salary by " + symbol + formatNumber(Math.abs(dispBalance)) + ".";
     savingsProgressBar.style.backgroundColor = "#e11d48";
 } else if (salary > 0 && remainingBalanceINR < tenPercentLimit) {
      remainingBalanceCard.classList.add("threshold-critical");
    thresholdAlertBanner.classList.remove("d-none");
      alertTitle.textContent = "Warning: Low Balance (< 10%)";
     alertMessage.textContent = "Remaining balance is less than 10% of total salary. Please check expenses.";
    savingsProgressBar.style.backgroundColor = "#f59e0b";
 } else {
      remainingBalanceCard.classList.remove("threshold-critical");
     thresholdAlertBanner.classList.add("d-none");
    savingsProgressBar.style.backgroundColor = "#10b981";
 }

 legendBalanceVal.textContent = symbol + formatNumber(Math.max(0, dispBalance));
   legendExpensesVal.textContent = symbol + formatNumber(dispExpenses);

  updateChart(Math.max(0, dispBalance), dispExpenses, symbol);
 renderExpensesList();
}

function renderExpensesList() {
 const symbol = currencySymbols[currentCurrency] || "₹";
   const searchFilter = (searchExpenseInput ? searchExpenseInput.value : "").trim().toLowerCase();

   const filtered = expenses.filter(function (item) {
    if (!searchFilter) return true;
      return item.name.toLowerCase().includes(searchFilter) ||
           (item.category && item.category.toLowerCase().includes(searchFilter)); });

 expensesCounter.textContent = expenses.length;
   expensesList.innerHTML = "";

 if (filtered.length === 0) {
      emptyExpensesState.classList.remove("d-none");
    return;
 }

   emptyExpensesState.classList.add("d-none");

 filtered.forEach(function (item) {
      const li = document.createElement("li");
    li.className = "ledger-row";

      const convertedVal = convertAmount(item.amount);
    const iconClass = categoryIcons[item.category] || "fa-layer-group";
      const colorClass = categoryClasses[item.category] || "cat-other";

    let dateStr = "Recent";
      if (item.date) {
       const d = new Date(item.date);
       dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

      const leftDiv = document.createElement("div");
     leftDiv.className = "row-left";

      const iconDiv = document.createElement("div");
    iconDiv.className = "cat-badge " + colorClass;
      iconDiv.innerHTML = '<i class="fa-solid ' + iconClass + '"></i>';

    const descDiv = document.createElement("div");
      descDiv.className = "row-desc";

      const titleSpan = document.createElement("span");
     titleSpan.className = "row-title";
    titleSpan.textContent = item.name;

      const metaSpan = document.createElement("span");
     metaSpan.className = "row-meta";
      metaSpan.textContent = (item.category || "Other") + " • " + dateStr;

    descDiv.appendChild(titleSpan);
      descDiv.appendChild(metaSpan);
     leftDiv.appendChild(iconDiv);
    leftDiv.appendChild(descDiv);

      const rightDiv = document.createElement("div");
     rightDiv.className = "row-right";

      const sumSpan = document.createElement("span");
     sumSpan.className = "row-sum";
    sumSpan.textContent = "-" + symbol + formatNumber(convertedVal);

      const deleteBtn = document.createElement("button");
     deleteBtn.className = "btn-remove";
    deleteBtn.title = "Delete expense";
      deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';

      deleteBtn.addEventListener("click", function () {
       deleteExpense(item.id, item.name); });

     rightDiv.appendChild(sumSpan);
    rightDiv.appendChild(deleteBtn);

      li.appendChild(leftDiv);
     li.appendChild(rightDiv);

      expensesList.appendChild(li); });
}

function deleteExpense(id, name) {
   expenses = expenses.filter(function (e) {
    return e.id !== id; });
 saveToLocalStorage();
   render();
 showToast("Deleted: " + name, "info");
}

function updateChart(balanceVal, expensesVal, symbol) {
 if (!window.Chart || !balanceChartCanvas) return;

   if (salary === 0 && expenses.length === 0) {
    if (chartInstance) {
         chartInstance.destroy();
       chartInstance = null;
    }
      balanceChartCanvas.classList.add("d-none");
    emptyChartPlaceholder.classList.remove("d-none");
      return;
 }

   balanceChartCanvas.classList.remove("d-none");
 emptyChartPlaceholder.classList.add("d-none");

   if (chartInstance) {
    chartInstance.destroy();
      chartInstance = null;
 }

 const isDark = document.body.classList.contains("theme-dark");
   const ctx = balanceChartCanvas.getContext("2d");

 chartInstance = new Chart(ctx, {
      type: "pie",
    data: {
         labels: ["Remaining Balance", "Total Expenses"],
       datasets: [{
            data: [balanceVal, expensesVal],
          backgroundColor: ["#059669", "#e11d48"],
            borderColor: isDark ? "#111827" : "#ffffff",
          borderWidth: 2
         }]
    },
      options: {
       responsive: true,
         maintainAspectRatio: false,
       plugins: {
            legend: {
             position: "bottom",
               labels: {
                color: isDark ? "#cbd5e1" : "#475569",
                  font: { family: "Inter", size: 11, weight: "500" },
                padding: 14
               }
          },
            tooltip: {
             callbacks: {
                  label: function (ctx) {
                   const label = ctx.label || "";
                     const val = ctx.raw || 0;
                   return " " + label + ": " + symbol + formatNumber(val);
                }
               }
          }
         }
    }
   });
}

salaryForm.addEventListener("submit", function (e) {
 e.preventDefault();

   const val = salaryInput.value.trim();

   if (val === "") {
    salaryInput.classList.add("input-invalid");
      salaryErrorMsg.classList.remove("d-none");
    salaryErrorMsg.querySelector("span").textContent = "Please enter your salary.";
      return;
 }

 const parsed = parseFloat(val);

   if (isNaN(parsed) || parsed <= 0) {
    salaryInput.classList.add("input-invalid");
      salaryErrorMsg.classList.remove("d-none");
    salaryErrorMsg.querySelector("span").textContent = "Salary must be a positive number.";
      return;
 }

 salaryInput.classList.remove("input-invalid");
   salaryErrorMsg.classList.add("d-none");

   salary = convertToBase(parsed);
 saveToLocalStorage();
   render();

 salaryInput.value = "";
   showToast("Salary saved successfully!", "success"); });

expenseForm.addEventListener("submit", function (e) {
 e.preventDefault();

   const nameVal = expenseNameInput.value.trim();
 const amtVal = expenseAmountInput.value.trim();
   const catVal = expenseCategorySelect.value || "Other";

 let hasError = false;

   if (nameVal === "") {
    expenseNameInput.classList.add("input-invalid");
      expenseNameErrorMsg.classList.remove("d-none");
    hasError = true;
 } else {
      expenseNameInput.classList.remove("input-invalid");
    expenseNameErrorMsg.classList.add("d-none");
 }

   if (amtVal === "") {
    expenseAmountInput.classList.add("input-invalid");
      expenseAmountErrorMsg.classList.remove("d-none");
    expenseAmountErrorMsg.querySelector("span").textContent = "Please enter an amount.";
      hasError = true;
 } else {
      const parsedAmt = parseFloat(amtVal);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
         expenseAmountInput.classList.add("input-invalid");
       expenseAmountErrorMsg.classList.remove("d-none");
         expenseAmountErrorMsg.querySelector("span").textContent = "Amount must be greater than zero.";
       hasError = true;
    } else {
         expenseAmountInput.classList.remove("input-invalid");
       expenseAmountErrorMsg.classList.add("d-none");
    }
 }

 if (hasError) return;

   const parsedAmt = parseFloat(amtVal);
 const inrAmt = convertToBase(parsedAmt);

   const newExpense = {
    id: "exp_" + Date.now(),
      name: nameVal,
    amount: inrAmt,
      category: catVal,
    date: new Date().toISOString()
 };

 expenses.unshift(newExpense);
   saveToLocalStorage();
 render();

 expenseNameInput.value = "";
   expenseAmountInput.value = "";
 expenseNameInput.focus();

   showToast("Expense added: " + nameVal, "success"); });

salaryInput.addEventListener("input", function () {
   salaryInput.classList.remove("input-invalid");
 salaryErrorMsg.classList.add("d-none"); });

expenseNameInput.addEventListener("input", function () {
   expenseNameInput.classList.remove("input-invalid");
 expenseNameErrorMsg.classList.add("d-none"); });

expenseAmountInput.addEventListener("input", function () {
   expenseAmountInput.classList.remove("input-invalid");
 expenseAmountErrorMsg.classList.add("d-none"); });

currencySelect.addEventListener("change", function () {
 currentCurrency = currencySelect.value;
   saveToLocalStorage();
 render();
   showToast("Currency changed to " + currentCurrency, "info"); });

if (searchExpenseInput) {
   searchExpenseInput.addEventListener("input", function () {
    renderExpensesList(); });
}

downloadPdfBtn.addEventListener("click", function () {
   if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast("PDF library loading...", "danger");
      return;
 }

 try {
      const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();

      const dateToday = new Date().toLocaleDateString("en-US", {
       year: "numeric",
         month: "long",
       day: "numeric"
    });

      let totalExpINR = 0;
    for (let i = 0; i < expenses.length; i++) {
         totalExpINR += expenses[i].amount;
    }
      const balINR = salary - totalExpINR;

    const dispSal = convertAmount(salary);
      const dispExp = convertAmount(totalExpINR);
    const dispBal = convertAmount(balINR);

      doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, "F");

      doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
    doc.text("Cash-Flow Statement", 14, 18);

      doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
      doc.text("Salary & Expense Tracker Report | " + dateToday, 14, 25);

    doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
      doc.text("Summary Overview", 14, 44);

      const summaryData = [
       ["Total Salary", currentCurrency + " " + formatNumber(dispSal)],
         ["Total Expenses", currentCurrency + " " + formatNumber(dispExp)],
       ["Remaining Balance", currentCurrency + " " + formatNumber(dispBal)],
         ["Savings Rate", (salary > 0 ? Math.round((balINR / salary) * 100) : 0) + "%"],
       ["Status", balINR < 0 ? "Budget Deficit" : (balINR < salary * 0.1 ? "Low Balance Warning" : "Healthy Budget")]
    ];

      doc.autoTable({
       startY: 48,
         head: [["Item", "Amount"]],
       body: summaryData,
         theme: "striped",
       headStyles: { fillColor: [15, 23, 42], textColor: 255 },
         styles: { fontSize: 9, cellPadding: 3 },
       margin: { left: 14, right: 14 }
    });

      const tableY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
    doc.text("Expense Items (" + expenses.length + ")", 14, tableY);

      const expenseTableData = expenses.map(function (item, index) {
       const d = item.date ? new Date(item.date).toLocaleDateString() : "-";
         return [
          index + 1,
            item.name,
          item.category || "Other",
            d,
          currentCurrency + " " + formatNumber(convertAmount(item.amount))
         ];
    });

      if (expenseTableData.length === 0) {
       expenseTableData.push(["-", "No expenses logged yet", "-", "-", currentCurrency + " 0.00"]);
    }

      doc.autoTable({
       startY: tableY + 4,
         head: [["#", "Expense Name", "Category", "Date", "Amount"]],
       body: expenseTableData,
         theme: "striped",
       headStyles: { fillColor: [30, 41, 59], textColor: 255 },
         styles: { fontSize: 9, cellPadding: 3 },
       margin: { left: 14, right: 14 }
    });

      doc.save("CashFlow_Report_" + new Date().toISOString().slice(0, 10) + ".pdf");
    showToast("PDF report downloaded!", "success");
 } catch (err) {
      showToast("Could not generate PDF.", "danger");
 }
});

function updateThemeIcon() {
   if (!themeIcon) return;
 if (document.body.classList.contains("theme-dark")) {
      themeIcon.className = "fa-solid fa-sun";
 } else {
      themeIcon.className = "fa-solid fa-moon";
 }
}

const savedTheme = localStorage.getItem("cashflow_theme") || "theme-light";
document.body.className = savedTheme;
updateThemeIcon();

themeToggleBtn.addEventListener("click", function () {
   if (document.body.classList.contains("theme-light")) {
    document.body.className = "theme-dark";
      localStorage.setItem("cashflow_theme", "theme-dark");
 } else {
      document.body.className = "theme-light";
    localStorage.setItem("cashflow_theme", "theme-light");
 }
   updateThemeIcon();
 render(); });

resetDataBtn.addEventListener("click", function () {
   resetConfirmModal.classList.remove("d-none"); });

cancelResetBtn.addEventListener("click", function () {
   resetConfirmModal.classList.add("d-none"); });

confirmResetBtn.addEventListener("click", function () {
 salary = 0;
   expenses = [];
 localStorage.removeItem("cashflow_data");
   resetConfirmModal.classList.add("d-none");
 render();
   showToast("All data reset.", "info"); });

resetConfirmModal.addEventListener("click", function (e) {
   if (e.target === resetConfirmModal) {
    resetConfirmModal.classList.add("d-none"); } });

window.addEventListener("DOMContentLoaded", async function () {
   loadFromLocalStorage();
 render();
   await fetchCurrencyRates();
 render(); });
