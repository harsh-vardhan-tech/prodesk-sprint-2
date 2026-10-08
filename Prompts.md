Prompt 1

I need to build the "Cash-Flow" Salary & Expense Tracker module for Sprint 02 using pure Vanilla JavaScript, HTML5, and CSS. First, set up the input architecture for capturing Total Salary (number), Expense Name (text), and Expense Amount (number). When submitted, render the salary on the DOM, calculate Remaining Balance = Total Salary - Total Expenses, dynamically add expenses to the list using document.createElement, and validate inputs so empty or negative numbers are blocked with error states. Make sure inputs are parsed with parseFloat or Number so numbers do not concatenate.

Prompt 2

Add Data Persistence and Visualization. Store the salary and expenses array in browser localStorage using JSON.stringify, and retrieve it on page load using JSON.parse so data stays after browser reloads. Add a delete trash button for every expense that removes it from the DOM, updates localStorage, and recalculates the Remaining Balance immediately. Also integrate Chart.js via CDN to show a dynamic Pie Chart of Remaining Balance vs Total Expenses, and make sure to destroy previous chart instances with .destroy() before re-rendering so the canvas does not duplicate.

Prompt 3

Implement the Phase 3 stretch goals. First, add a "Download Report" button using jsPDF and jspdf-autotable to export the full financial statement with salary, expenses, and remaining balance into a clean PDF. Second, connect the keyless Frankfurter API to allow toggling currencies between INR, USD, EUR, and GBP with real-time conversion. Third, implement a critical threshold alert: if the remaining balance drops below 10% of the total salary or goes into a deficit, turn the balance text red and show an alert warning banner.

Prompt 4

Review the user interface and styling. Make it look like a clean modern fintech dashboard with dark and light mode toggle, financial KPI cards (Total Salary, Total Expenses, Remaining Balance, Savings Rate), category icons, an expense filter search bar, and toast notifications. Ensure zero framework dependencies and no console errors.
