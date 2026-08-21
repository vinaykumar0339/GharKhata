import assert from 'node:assert/strict';
import test from 'node:test';
import { budgetRows, categoryTotals, expenseTotal } from '../src/lib/analytics.ts';
import { calculateAmount, formatCurrency } from '../src/lib/format.ts';
import { validateBudget } from '../src/lib/validation.ts';

const baseExpense = { createdBy: 'user-a', projectId: 'project-a', date: '2026-08-21', stageId: 'foundation', categoryId: 'cement', item: 'Cement', description: '', paidById: 'cash', paymentStatusId: 'paid', notes: '', createdAt: '', updatedAt: '' };

test('currency format respects the selected account currency', () => {
  assert.equal(formatCurrency(125000, 'INR'), '₹1,25,000');
  assert.equal(formatCurrency(1250, 'USD'), '$1,250.00');
});

test('quantity × rate takes precedence, while direct amounts remain supported', () => {
  assert.equal(calculateAmount(50, 420, 100), 21000);
  assert.equal(calculateAmount(2.5, 420.5, 100), 1051.25);
  assert.equal(calculateAmount(undefined, undefined, 25000), 25000);
});

test('budget actuals use relationships by ID and mark overruns', () => {
  const expenses = [{ id: 'expense-1', ...baseExpense, amount: 580000 }];
  const categories = [{ id: 'cement', projectId: 'project-a', name: 'Cement', type: 'categories' as const, createdAt: '', updatedAt: '' }];
  const budget = { id: 'project-a', projectId: 'project-a', totalBudget: 500000, categoryBudgets: [{ categoryId: 'cement', amount: 500000 }], updatedAt: '' };
  assert.equal(expenseTotal(expenses), 580000);
  assert.deepEqual(categoryTotals(expenses, categories), [{ id: 'cement', name: 'Cement', amount: 580000 }]);
  assert.deepEqual(budgetRows(budget, expenses, categories)[0]?.difference, -80000);
});

test('category budget allocations cannot exceed the total budget', () => {
  assert.deepEqual(validateBudget(1000, [{ categoryId: 'cement', amount: 600 }, { categoryId: 'steel', amount: 400 }]), {});
  assert.deepEqual(validateBudget(1000, [{ categoryId: 'cement', amount: 600 }, { categoryId: 'steel', amount: 401 }]), {
    categoryBudgets: 'Category allocations cannot exceed the total budget.',
  });
});
