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

// Budget and expense data
let budget = 0;
let expenses = [];

// Load data from localStorage
function loadFromLocalStorage() {
  budget = parseFloat(localStorage.getItem('budget')) || 0;
  expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  updateUI();
}

// Save data to localStorage
function saveToLocalStorage() {
  localStorage.setItem('budget', budget);
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Update the UI
function updateUI() {
  budgetDisplay.textContent = `Budget: $${budget}`;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  remainingBudgetDisplay.textContent = `Remaining Budget: $${budget - totalExpenses}`;

  // Render expense list
  expenseList.innerHTML = '';
  expenses.forEach((expense, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${expense.name} - $${expense.amount} (${expense.category})
      <button onclick="deleteExpense(${index})">Delete</button>
    `;
    expenseList.appendChild(li);
  });
}

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

// Add an expense
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = expenseName.value;
  const amount = parseFloat(expenseAmount.value);
  const category = expenseCategory.value;

  if (!name || isNaN(amount) || amount <= 0 || !category) {
    alert('Please fill in all fields correctly.');
    return;
  }

  expenses.push({ name, amount, category });
  saveToLocalStorage();
  updateUI();

  expenseName.value = '';
  expenseAmount.value = '';
  expenseCategory.value = '';
});

// Delete an expense
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveToLocalStorage();
  updateUI();
}

// Initialize app
loadFromLocalStorage();
