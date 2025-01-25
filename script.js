// Get DOM elements
const budgetInput = document.getElementById('budget-input');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetDisplay = document.getElementById('budget-display');
const expenseForm = document.getElementById('expense-form');
const expenseName = document.getElementById('expense-name');
const expenseAmount = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const expenseList = document.getElementById('expense-list');
const remainingBudgetDisplay = document.getElementById('remaining-budget');
const incomeInput = document.getElementById('income-input');
const setIncomeBtn = document.getElementById('set-income-btn');
const incomeDisplay = document.getElementById('income-display');
const currencySelector = document.getElementById('currency-selector');

// Add this after your existing DOM elements
const categoryDropdown = document.querySelector('.dropdown__items');
const categoryText = document.querySelector('.dropdown__text');
const categoryInput = document.getElementById('category-dropdown');

// Update DOM elements
const currencyDropdownText = document.querySelector('.currency-dropdown .dropdown__text');
const currencyDropdownItems = document.querySelector('.currency-dropdown .dropdown__items');
const currencyDropdownInput = document.getElementById('currency-dropdown');

// Add new DOM elements
const recurringForm = document.getElementById('recurring-form');
const recurringName = document.getElementById('recurring-name');
const recurringAmount = document.getElementById('recurring-amount');
const recurringList = document.getElementById('recurring-list');
const recurringCategoryText = document.querySelector('#recurring-form .dropdown__text');
const recurringFrequencyText = document.querySelector('#recurring-frequency-dropdown + label .dropdown__text');
const reportPeriodText = document.querySelector('#report-period-dropdown + label .dropdown__text');
const customDateRange = document.getElementById('custom-date-range');
const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const generateReportBtn = document.getElementById('generate-report-btn');
const downloadReportBtn = document.getElementById('download-report-btn');

// Add after your existing DOM elements
const categoryChart = document.getElementById('categoryChart').getContext('2d');
const trendChart = document.getElementById('trendChart').getContext('2d');

let categoryChartInstance = null;
let trendChartInstance = null;

// Budget and expense data
let income = 0;
let budget = 0;
let expenses = [];
let recurringExpenses = [];

// Currency formatting
let selectedCurrency = 'USD';
const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  UGX: 'USh'
};

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: selectedCurrency === 'UGX' ? 0 : 2,
    maximumFractionDigits: selectedCurrency === 'UGX' ? 0 : 2
  }).format(amount);
}

// Load data from localStorage
function loadFromLocalStorage() {
  income = parseFloat(localStorage.getItem('income')) || 0;
  budget = parseFloat(localStorage.getItem('budget')) || 0;
  expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  selectedCurrency = localStorage.getItem('currency') || 'USD';
  recurringExpenses = JSON.parse(localStorage.getItem('recurring')) || [];
  
  // Update currency dropdown text
  const currencyOption = document.querySelector(`.currency-dropdown li[data-value="${selectedCurrency}"]`);
  if (currencyOption) {
    currencyDropdownText.textContent = currencyOption.textContent.split(' ').slice(1).join(' '); // Remove flag emoji
  }
  
  updateUI();
}

// Save data to localStorage
function saveToLocalStorage() {
  localStorage.setItem('income', income);
  localStorage.setItem('budget', budget);
  localStorage.setItem('expenses', JSON.stringify(expenses));
  localStorage.setItem('currency', selectedCurrency);
  localStorage.setItem('recurring', JSON.stringify(recurringExpenses));
}

// Update the UI
function updateUI() {
  // Update display values
  incomeDisplay.textContent = `Income: ${formatMoney(income)}`;
  budgetDisplay.textContent = `Budget: ${formatMoney(budget)}`;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  remainingBudgetDisplay.textContent = `Remaining Budget: ${formatMoney(budget - totalExpenses)}`;

  // Update input placeholders with current currency
  const symbol = currencySymbols[selectedCurrency];
  incomeInput.placeholder = `Enter Monthly Income (${symbol})`;
  budgetInput.placeholder = `Enter Monthly Budget (${symbol})`;
  expenseAmount.placeholder = `Amount (${symbol})`;

  // Render expense list
  expenseList.innerHTML = '';
  expenses.forEach((expense, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${expense.name} - ${formatMoney(expense.amount)} (${expense.category})
      <button onclick="deleteExpense(${index})">Delete</button>
    `;
    expenseList.appendChild(li);
  });

  // Update recurring expenses list
  recurringList.innerHTML = '';
  recurringExpenses.forEach((expense, index) => {
    const li = document.createElement('li');
    const dueDate = new Date(expense.nextDue);
    li.innerHTML = `
      ${expense.name} - ${formatMoney(expense.amount)} 
      (${expense.category}) - ${expense.frequency}
      <br>Next due: ${dueDate.toLocaleDateString()}
      <button onclick="toggleRecurring(${index})">${expense.active ? 'Pause' : 'Resume'}</button>
      <button onclick="deleteRecurring(${index})">Delete</button>
    `;
    recurringList.appendChild(li);
  });

  // Check for due recurring expenses
  checkRecurringExpenses();

  // Update charts
  updateCharts();
}

// Set the income
setIncomeBtn.addEventListener('click', () => {
  income = parseFloat(incomeInput.value);
  if (isNaN(income) || income <= 0) {
    alert('Please enter a valid income amount.');
    return;
  }
  saveToLocalStorage();
  updateUI();
});

// Set the budget
setBudgetBtn.addEventListener('click', () => {
  budget = parseFloat(budgetInput.value);
  if (isNaN(budget) || budget <= 0) {
    alert('Please enter a valid budget.');
    return;
  }
  saveToLocalStorage();
  updateUI();
});

// Update the category selection handling
categoryDropdown.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    const selectedValue = e.target.dataset.value;
    categoryText.textContent = selectedValue;
    categoryInput.checked = false; // Close the dropdown
  }
});

// Update the form submission to use the new category selector
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = expenseName.value;
  const amount = parseFloat(expenseAmount.value);
  const category = categoryText.textContent;

  if (!name || isNaN(amount) || amount <= 0 || category === 'Select Category') {
    alert('Please fill in all fields correctly.');
    return;
  }

  expenses.push({ 
    name, 
    amount, 
    category,
    date: new Date().toISOString() // Add date to expense
  });
  
  saveToLocalStorage();
  updateUI();

  expenseName.value = '';
  expenseAmount.value = '';
  categoryText.textContent = 'Select Category';
});

// Delete an expense
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveToLocalStorage();
  updateUI();
}

// Handle currency dropdown selection
currencyDropdownItems.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    const selectedValue = e.target.dataset.value;
    selectedCurrency = selectedValue;
    currencyDropdownText.textContent = e.target.textContent.split(' ').slice(1).join(' '); // Remove flag emoji
    currencyDropdownInput.checked = false; // Close the dropdown
    saveToLocalStorage();
    updateUI();
  }
});

// Add recurring expense
recurringForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = recurringName.value;
  const amount = parseFloat(recurringAmount.value);
  const category = recurringCategoryText.textContent;
  const frequency = recurringFrequencyText.textContent;

  if (!name || isNaN(amount) || amount <= 0 || 
      category === 'Select Category' || 
      frequency === 'Select Frequency') {
    alert('Please fill in all fields correctly.');
    return;
  }

  const nextDue = calculateNextDueDate(frequency);

  recurringExpenses.push({
    name,
    amount,
    category,
    frequency,
    nextDue,
    active: true
  });

  saveToLocalStorage();
  updateUI();

  recurringName.value = '';
  recurringAmount.value = '';
  recurringCategoryText.textContent = 'Select Category';
  recurringFrequencyText.textContent = 'Select Frequency';
});

// Calculate next due date based on frequency
function calculateNextDueDate(frequency) {
  const today = new Date();
  switch(frequency) {
    case 'Weekly':
      return new Date(today.setDate(today.getDate() + 7));
    case 'Monthly':
      return new Date(today.setMonth(today.getMonth() + 1));
    case 'Quarterly':
      return new Date(today.setMonth(today.getMonth() + 3));
    case 'Yearly':
      return new Date(today.setFullYear(today.getFullYear() + 1));
    default:
      return today;
  }
}

// Toggle recurring expense active status
function toggleRecurring(index) {
  recurringExpenses[index].active = !recurringExpenses[index].active;
  saveToLocalStorage();
  updateUI();
}

// Delete recurring expense
function deleteRecurring(index) {
  recurringExpenses.splice(index, 1);
  saveToLocalStorage();
  updateUI();
}

// Check and process due recurring expenses
function checkRecurringExpenses() {
  const today = new Date();
  recurringExpenses.forEach(expense => {
    if (!expense.active) return;
    
    const dueDate = new Date(expense.nextDue);
    if (dueDate <= today) {
      // Add the expense
      expenses.push({
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        date: today.toISOString()
      });

      // Update next due date
      expense.nextDue = calculateNextDueDate(expense.frequency);
    }
  });
  
  saveToLocalStorage();
}

// Add these new functions for chart handling
function updateCharts() {
  updateCategoryChart();
  updateTrendChart();
}

function updateCategoryChart() {
  // Calculate totals for each category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ]
    }]
  };

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  categoryChartInstance = new Chart(categoryChart, {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.label}: ${formatMoney(value)}`;
            }
          }
        }
      }
    }
  });
}

function updateTrendChart() {
  // Group expenses by month
  const monthlyData = {};
  expenses.forEach(expense => {
    const date = expense.date ? new Date(expense.date) : new Date();
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
  });

  // Sort months and get last 6 months
  const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
  const monthLabels = sortedMonths.map(month => {
    const [year, monthNum] = month.split('-');
    return new Date(year, monthNum - 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  });

  const data = {
    labels: monthLabels,
    datasets: [{
      label: 'Monthly Spending',
      data: sortedMonths.map(month => monthlyData[month]),
      borderColor: '#6f42c1',
      backgroundColor: 'rgba(111, 66, 193, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  trendChartInstance = new Chart(trendChart, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatMoney(value);
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatMoney(context.raw);
            }
          }
        }
      }
    }
  });
}

// Handle report period selection
document.querySelector('#report-period-dropdown + label + .dropdown__items').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    const selectedValue = e.target.dataset.value;
    reportPeriodText.textContent = e.target.textContent.split(' ').slice(1).join(' ');
    customDateRange.style.display = selectedValue === 'custom' ? 'flex' : 'none';
  }
});

// Generate report
generateReportBtn.addEventListener('click', () => {
  const period = reportPeriodText.textContent;
  const [start, end] = getDateRange(period);
  generateReport(start, end);
});

// Download report
downloadReportBtn.addEventListener('click', () => {
  const period = reportPeriodText.textContent;
  const [start, end] = getDateRange(period);
  downloadReport(start, end);
});

function getDateRange(period) {
  const today = new Date();
  const start = new Date();
  const end = new Date();

  switch(period) {
    case 'This Month':
      start.setDate(1);
      break;
    case 'Last Month':
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
      break;
    case 'Last 3 Months':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'This Year':
      start.setMonth(0, 1);
      break;
    case 'Custom Range':
      return [new Date(startDate.value), new Date(endDate.value)];
    default:
      start.setMonth(start.getMonth() - 1);
  }
  
  return [start, end];
}

function generateReport(start, end) {
  // Filter expenses for the selected period
  const periodExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });

  // Calculate summary metrics
  const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const periodIncome = income; // Assuming monthly income
  const savings = periodIncome - totalExpenses;
  const savingsRate = (savings / periodIncome) * 100;

  // Update summary cards
  document.getElementById('report-income').textContent = formatMoney(periodIncome);
  document.getElementById('report-expenses').textContent = formatMoney(totalExpenses);
  document.getElementById('report-savings').textContent = formatMoney(savings);
  document.getElementById('report-savings-rate').textContent = `${savingsRate.toFixed(1)}%`;

  // Generate category breakdown
  const categoryBreakdown = periodExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categoryTable = document.querySelector('#category-breakdown tbody');
  categoryTable.innerHTML = '';
  Object.entries(categoryBreakdown).forEach(([category, amount]) => {
    const percentage = (amount / totalExpenses) * 100;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${category}</td>
      <td>${formatMoney(amount)}</td>
      <td>${percentage.toFixed(1)}%</td>
      <td class="${amount > budget ? 'negative' : 'positive'}">
        ${formatMoney(budget - amount)}
      </td>
    `;
    categoryTable.appendChild(row);
  });

  // Generate top expenses
  const topExpensesTable = document.querySelector('#top-expenses tbody');
  topExpensesTable.innerHTML = '';
  [...periodExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${expense.name}</td>
        <td>${expense.category}</td>
        <td>${formatMoney(expense.amount)}</td>
        <td>${new Date(expense.date).toLocaleDateString()}</td>
      `;
      topExpensesTable.appendChild(row);
    });

  // Generate budget analysis
  const budgetTable = document.querySelector('#budget-analysis tbody');
  budgetTable.innerHTML = '';
  const metrics = [
    ['Total Budget', budget, totalExpenses],
    ['Average Daily', budget / 30, totalExpenses / 30],
    ['Projected Monthly', budget, (totalExpenses / 30) * 30]
  ];

  metrics.forEach(([metric, planned, actual]) => {
    const variance = planned - actual;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${metric}</td>
      <td>${formatMoney(planned)}</td>
      <td>${formatMoney(actual)}</td>
      <td class="${variance < 0 ? 'negative' : 'positive'}">
        ${formatMoney(variance)}
      </td>
    `;
    budgetTable.appendChild(row);
  });
}

function downloadReport(start, end) {
  const period = `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
  let report = `Budget Tracker Report (${period})\n\n`;

  // Add summary
  report += `SUMMARY\n`;
  report += `Income: ${document.getElementById('report-income').textContent}\n`;
  report += `Expenses: ${document.getElementById('report-expenses').textContent}\n`;
  report += `Savings: ${document.getElementById('report-savings').textContent}\n`;
  report += `Savings Rate: ${document.getElementById('report-savings-rate').textContent}\n\n`;

  // Add category breakdown
  report += `CATEGORY BREAKDOWN\n`;
  document.querySelectorAll('#category-breakdown tbody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    report += `${cells[0].textContent}: ${cells[1].textContent} (${cells[2].textContent})\n`;
  });
  report += '\n';

  // Add top expenses
  report += `TOP EXPENSES\n`;
  document.querySelectorAll('#top-expenses tbody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    report += `${cells[0].textContent} - ${cells[2].textContent} (${cells[1].textContent}) on ${cells[3].textContent}\n`;
  });

  // Create and download file
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-report-${start.toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initialize app
loadFromLocalStorage();
