import type { Budget, CostBucket, Expense, MasterItem } from '@/types/domain';

export function expenseTotal(expenses: Expense[]) { return expenses.reduce((sum, expense) => sum + expense.amount, 0); }
export function expenseBucket(expense: Expense): CostBucket { return expense.costBucket ?? 'construction'; }
export function bucketTotal(expenses: Expense[], bucket: CostBucket) { return expenses.filter((expense) => expenseBucket(expense) === bucket).reduce((sum, expense) => sum + expense.amount, 0); }

/** A side-by-side view of the two ways project spending is budgeted. */
export function budgetTypeTotals(expenses: Expense[], budget?: Budget, legacyConstructionBudget = 0) {
  const constructionBudget = budget?.constructionBudget ?? budget?.totalBudget ?? legacyConstructionBudget;
  const otherBudget = budget?.otherBudget ?? 0;
  return (['construction', 'other'] as const).map((bucket) => {
    const planned = bucket === 'construction' ? constructionBudget : otherBudget;
    const actual = bucketTotal(expenses, bucket);
    return {
      bucket,
      name: bucket === 'construction' ? 'Construction work' : 'Other project costs',
      planned,
      actual,
      difference: planned - actual,
    };
  });
}

export function categoryTotals(expenses: Expense[], categories: MasterItem[]) {
  return categories.map((category) => ({
    id: category.id, name: category.name,
    amount: expenses.filter((expense) => expense.categoryId === category.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function fundingSourceTotals(expenses: Expense[], sources: MasterItem[]) {
  const sourceIds = new Set(expenses.map((expense) => expense.fundingSourceId ?? 'unassigned'));
  return [...sourceIds].map((id) => ({
    id,
    name: id === 'unassigned' ? 'Unassigned source' : sources.find((source) => source.id === id)?.name ?? 'Removed source',
    amount: expenses.filter((expense) => (expense.fundingSourceId ?? 'unassigned') === id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function stageTotals(expenses: Expense[], stages: MasterItem[]) {
  return stages.map((stage) => ({
    id: stage.id, name: stage.name,
    amount: expenses.filter((expense) => expense.stageId === stage.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

export function budgetRows(budget: Budget | undefined, expenses: Expense[], categories: MasterItem[], bucket: CostBucket = 'construction') {
  const totals = categoryTotals(expenses.filter((expense) => expenseBucket(expense) === bucket), categories);
  const allocations = (budget?.categoryBudgets ?? []).filter((line) => (line.costBucket ?? 'construction') === bucket);
  const categoryIds = new Set([...allocations.map((line) => line.categoryId), ...totals.map((item) => item.id)]);
  return [...categoryIds].map((categoryId) => {
    const planned = allocations.find((line) => line.categoryId === categoryId)?.amount ?? 0;
    const actual = totals.find((item) => item.id === categoryId)?.amount ?? 0;
    return { categoryId, name: categories.find((item) => item.id === categoryId)?.name ?? 'Removed category', budget: planned, actual, difference: planned - actual };
  }).sort((a, b) => b.actual - a.actual || b.budget - a.budget);
}

export function monthTotal(expenses: Expense[], monthOffset = 0) {
  const target = new Date(); target.setMonth(target.getMonth() + monthOffset);
  const key = target.toISOString().slice(0, 7);
  return expenses.filter((expense) => expense.date.startsWith(key)).reduce((sum, expense) => sum + expense.amount, 0);
}

export function monthlyTotals(expenses: Expense[], months = 6, reference = new Date()) {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(reference.getFullYear(), reference.getMonth() - (months - index - 1), 1);
    const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0')].join('-');
    return {
      key,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      amount: expenses.filter((expense) => expense.date.startsWith(key)).reduce((sum, expense) => sum + expense.amount, 0),
    };
  });
}
