# CashFlow Salary and Expense Tracker

this is my sprint 2 project for prodesk IT internship i built it using html css and javascript only no react or any framework


## what this project does

basically its a salary and expense tracker where you enter your monthly salary and then keep adding expenses like rent food shopping etc and it shows your remaining balance in real time with a pie chart everything saves in localstorage so even if you close the browser data stays there you can also download a pdf report of your full statement


## what i used

html for the page structure
css for styling and making it responsive
vanilla javascript for all the logic
localstorage for saving salary and expenses
chart js cdn for the pie chart
jspdf and autotable cdn for pdf download
open er api and frankfurter api for live currency rates


## features i added

set monthly salary and it shows on the dashboard card
add expenses with name amount and category
it calculates total salary minus total expenses and shows remaining balance
if you put empty or negative number it shows error below the input
localstorage saves everything so data stays after page refresh
each expense has a delete button that removes it and updates balance
pie chart showing remaining balance vs total expenses
download pdf report with summary table and expense list
currency change option for INR USD EUR GBP using live api
warning alert banner when balance goes below 10 percent of salary
dark mode and light mode toggle
search bar to filter expenses by name or category


## project files

index html has the full dashboard layout with forms cards chart and list
style css has all the styling colors responsive design dark mode
script js has all the javascript logic calculations localstorage chart and pdf
Prompts md has the prompts i used during development
README md is this file


## ai help

i used ai to help me find bugs in my code and to understand how javascript functions work like localstorage json stringify chart js destroy method and jspdf the design colors and layout i decided myself


## how to run

just open index html in browser or use live server extension in vs code
