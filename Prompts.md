Prompt 1

I am building the "Cash-Flow" Salary and Expense Tracker project for Sprint 2 using pure HTML, CSS, and Vanilla JavaScript. Please help me create the initial dashboard layout. I need two forms on the left side: one form to enter "Total Salary" and another form to enter "Expense Name", "Expense Amount", and a category dropdown. On top, I need summary cards for Total Salary, Total Expenses, Remaining Balance, and Savings Rate. On the right side, add a section for a dynamic chart and an expense list ledger. Please keep the design clean and modern like a fintech dashboard without using any frontend frameworks like React.

Prompt 2

Now help me write the core JavaScript logic for Phase 1. When the user submits the salary form, display the salary on the Total Salary card. When the user submits an expense, dynamically create and append a new list item to the expense list using document.createElement. Calculate and display: Total Salary - Total Expenses = Remaining Balance. Also, add strict validation: if the inputs are empty or negative numbers, prevent execution and show inline error messages under the input fields. Make sure to parse the input values with parseFloat or Number so the numbers do not concatenate as strings like "10 + 10 = 1010".

Prompt 3

I want to implement data persistence using LocalStorage. How do I serialize and save both the Total Salary and the Expenses array into browser localStorage so that the data stays saved even when the user refreshes or reloads the page? Please make sure it does not save as [object Object]. Also, explain how to retrieve and render this data on page load using JSON.parse. In addition, add a working delete action (trash icon) for each expense in the list so that clicking it removes the item from the DOM, updates localStorage, and immediately recalculates the Remaining Balance.

Prompt 4

Now help me integrate Chart.js using the CDN script tag. I want to render a dynamic Pie Chart showing "Remaining Balance vs. Total Expenses". The chart should update automatically whenever a new expense is added or deleted. Please explain how to handle the Chart.js lifecycle properly using the .destroy() method so the canvas does not glitch or duplicate when re-rendering with new data.

Prompt 5

I want to add the Phase 3 features. First, integrate a "Download Report" button using the jsPDF and jspdf-autotable CDN libraries so the user can export their salary, expense list, and remaining balance as a formatted PDF statement. Second, connect a third-party free currency API (like Frankfurter API) to allow the user to toggle between INR, USD, EUR, and GBP in real time without needing a paid API key. Please also add fallback rates in case the user is offline.

Prompt 6

Implement the threshold alert requirement. If the Remaining Balance drops below 10% of the Total Salary, or if it goes into a deficit (negative balance), trigger a critical warning by turning the balance text red and displaying a warning alert banner at the top of the dashboard. When the balance is healthy above 10%, keep the banner hidden. Also add a dark and light theme toggle button, an expense search filter, and check that the entire code runs cleanly in pure Vanilla JavaScript with zero console errors.
