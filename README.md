# Cash-Flow: Salary & Expense Tracker

A real-time financial tracking dashboard built with pure Vanilla JavaScript for Prodesk IT Internship Sprint 02 (Logic & Data).

## What is this project?

Cash-Flow helps users manage their personal budget. You can set your monthly salary, log daily expenses, view your remaining balance in real time, and visualize your spending habits through an interactive pie chart. The data stays saved even after refreshing the page, and you can export your complete financial statement as a PDF.

## Technologies Used

- **HTML5**: Semantic markup and form structures
- **CSS3**: Modern responsive layout (CSS Grid & Flexbox), dark/light theme, custom styling
- **Vanilla JavaScript**: DOM manipulation, event listeners, state calculations (no frameworks)
- **LocalStorage API**: Data persistence across browser reloads
- **Chart.js (CDN)**: Dynamic pie chart showing Remaining Balance vs. Total Expenses
- **jsPDF & AutoTable (CDN)**: Export expense statements to PDF
- **Frankfurter API**: Real-time currency conversion (INR, USD, EUR, GBP)

## Key Features

1. **Phase 1: Base MVP**
   - Input forms for Total Salary, Expense Name, and Expense Amount.
   - Real-time balance calculation: `Remaining Balance = Total Salary - Total Expenses`.
   - Strict input validation against empty values, zero, or negative numbers.
   - Dynamic DOM list rendering using `document.createElement`.

2. **Phase 2: Persistence & Visualization**
   - LocalStorage integration using `JSON.stringify` and `JSON.parse`.
   - Delete action (trash icon) for each expense with instant balance recalculation.
   - Chart.js Pie Chart updating dynamically with proper `.destroy()` lifecycle management.

3. **Phase 3: Stretch Goals**
   - **Download Report**: Generates a clean PDF statement with tables using jsPDF.
   - **Currency Switcher**: Real-time conversion toggle between INR (₹), USD ($), EUR (€), and GBP (£) with live API fetch.
   - **Critical Threshold Alert**: Warning banner triggers and balance text turns red if remaining balance drops below 10% of total salary or enters a deficit.
   - Dark / Light mode toggle.
   - Expense filter / search bar.

## Project Files

- `index.html`: Dashboard markup, forms, KPI cards, and canvas
- `style.css`: Modern fintech UI design, responsive layout, animations, and theme variables
- `script.js`: Core logic, DOM manipulation, calculations, storage, chart handling, and API calls
- `Prompts.md`: Prompts used during development
- `README.md`: Project summary and documentation

## How to Run Locally

1. Clone or download this repository.
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox).
3. Alternatively, run with Live Server in VS Code or any local static server.
