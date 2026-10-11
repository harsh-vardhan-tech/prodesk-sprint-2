# Cash-Flow Salary and Expense Tracker

I made this Cash-Flow salary and expense tracker project for the Prodesk IT internship Sprint 2 deliverable using pure HTML, CSS and Vanilla JavaScript.

## What is this project

Cash-Flow helps users track their monthly salary, add daily expenses and see real time calculations. It calculates remaining balance and savings rate dynamically and displays spending with an interactive pie chart. All data stays saved in the browser LocalStorage after reload, and users can export their statement as a PDF report.

## Technologies Used

- HTML
- CSS (Flexbox and Grid)
- Vanilla JavaScript (DOM manipulation and Event Listeners)
- LocalStorage API for data persistence
- Chart.js CDN for pie chart
- jsPDF and AutoTable CDN for PDF report download
- Frankfurter API for live currency exchange (INR, USD, EUR, GBP)

## Main Features

- Set monthly salary with instant card update
- Add expenses with name, amount, category and date
- Real time calculation of Total Salary - Total Expenses = Remaining Balance
- Form validation for empty fields and positive numbers
- LocalStorage persistence across page refresh
- Delete action with trash icon that updates balance instantly
- Dynamic Chart.js pie chart for Remaining Balance vs Total Expenses
- Download PDF statement report
- Currency switcher for INR, USD, EUR and GBP
- Warning alert banner when balance drops below 10% or goes negative
- Dark and light theme toggle
- Search filter for expense list

## Project Files

- `index.html` - dashboard layout, forms and chart canvas
- `style.css` - layout, responsive styling and theme colors
- `script.js` - calculations, DOM events, LocalStorage and chart logic
- `Prompts.md` - prompts used during development
- `README.md` - project overview and documentation

## AI Assistance

I used AI as an assistant for checking bugs, improving CSS, understanding JavaScript logic and reviewing the code. I created the HTML structure, colors, layout and main feature decisions myself.

## How to Run Locally

1. Open `index.html` in any browser.
2. Or use Live Server in VS Code to run the project locally.
