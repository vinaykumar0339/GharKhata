import type { CategoryBudget, Expense } from '@/types/domain';

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export function validateExpense(input: Partial<ExpenseInput>) {
  const errors: Record<string, string> = {};
  if (!input.projectId) errors.projectId = 'Choose a project.';
  if (!input.date) errors.date = 'Date is required.';
  if (!input.stageId) errors.stageId = 'Choose a stage.';
  if (!input.categoryId) errors.categoryId = 'Choose a category.';
  if (!input.item?.trim()) errors.item = 'Add an item name.';
  if (!input.paidById) errors.paidById = 'Choose how this was paid.';
  if (!input.paymentStatusId) errors.paymentStatusId = 'Choose a payment status.';
  if (!input.amount || input.amount <= 0) errors.amount = 'Amount must be greater than zero.';
  if (input.quantity !== undefined && input.quantity < 0) errors.quantity = 'Quantity cannot be negative.';
  if (input.rate !== undefined && input.rate < 0) errors.rate = 'Rate cannot be negative.';
  return errors;
}

export function validateBudget(totalBudget: number, categoryBudgets: CategoryBudget[]) {
  const errors: Record<string, string> = {};
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    errors.totalBudget = 'Total budget must be greater than zero.';
    return errors;
  }

  const categoryTotal = categoryBudgets.reduce((sum, line) => sum + line.amount, 0);
  const roundingTolerance = Number.EPSILON * Math.max(1, Math.abs(totalBudget), Math.abs(categoryTotal)) * 10;
  if (categoryTotal - totalBudget > roundingTolerance) {
    errors.categoryBudgets = 'Category allocations cannot exceed the total budget.';
  }
  return errors;
}
