import type { Budget, Expense, MasterItem } from '@/types/domain';

export function expenseTotal(expenses: Expense[]) { return expenses.reduce((sum, expense) => sum + expense.amount, 0); }

export function categoryTotals(expenses: Expense[], categories: MasterItem[]) {
  return categories.map((category) => ({
    id: category.id, name: category.name,
    amount: expenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function stageTotals(expenses: Expense[], stages: MasterItem[]) {
  return stages.map((stage) => ({
    id: stage.id, name: stage.name,
    amount: expenses.filter((expense) => expense.stageId === stage.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function budgetRows(budget: Budget | undefined, expenses: Expense[], categories: MasterItem[]) {
  const totals = categoryTotals(expenses, categories);
  return (budget?.categoryBudgets ?? []).map((line) => {
    const actual = totals.find((item) => item.id === line.categoryId)?.amount ?? 0;
    return { categoryId: line.categoryId, name: categories.find((item) => item.id === line.categoryId)?.name ?? 'Removed category', budget: line.amount, actual, difference: line.amount - actual };
  });
}

export function monthTotal(expenses: Expense[], monthOffset = 0) {
  const target = new Date(); target.setMonth(target.getMonth() + monthOffset);
  const key = target.toISOString().slice(0, 7);
  return expenses.filter((expense) => expense.date.startsWith(key)).reduce((sum, expense) => sum + expense.amount, 0);
}
