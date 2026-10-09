# Cash-Flow: Salary & Expense Tracker

I built this salary and expense tracker dashboard for the Prodesk IT internship Sprint 02 (Logic & Data).

## What is this project?

Cash-Flow helps users track their monthly salary, log daily expenses, and view real-time calculations. It calculates the remaining balance dynamically and shows spending habits through an interactive pie chart. All data stays saved in the browser even after refreshing the page, and users can export their statement as a PDF report.

## Technologies Used

- HTML5
- CSS3 (Flexbox and Grid)
- Vanilla JavaScript (DOM manipulation and Event Listeners)
- LocalStorage API (Data persistence)
- Chart.js (CDN) for dynamic pie chart
- jsPDF & AutoTable (CDN) for PDF statement export
- Frankfurter API for live currency conversion (INR, USD, EUR, GBP)

## Main Features

- Set monthly salary with instant DOM update
- Add expenses dynamically to the ledger with automated dates
- Real-time balance calculation: `Total Salary - Total Expenses = Remaining Balance`
- Input validation preventing empty, zero, or negative numbers
- LocalStorage persistence across browser reloads
- Delete action (trash icon) for expenses with instant recalculation
- Dynamic Chart.js pie chart (Remaining Balance vs. Total Expenses)
- Download PDF report with formatted summary and expense table
- Real-time currency conversion toggle (INR, USD, EUR, GBP)
- Critical threshold warning banner and red text when balance is under 10% or negative
- Dark and light theme toggle
- Filter / search box for logged expenses

## Project Files

- `index.html` - dashboard layout, forms, and chart canvas
- `style.css` - responsive layout, theme colors, and UI styling
- `script.js` - state calculations, DOM manipulation, LocalStorage, and APIs
- `Prompts.md` - prompts used during development
- `README.md` - project overview and documentation

## How to Run Locally

1. Open `index.html` in any modern web browser.
2. Alternatively, run with Live Server in VS Code or any static HTTP server.
