export type CurrencyCode = 'INR' | 'USD';
export type PaymentState = 'Paid' | 'Pending' | 'Partially Paid' | 'Advance';
export type ProjectRole = 'admin' | 'editor' | 'viewer';
export type CostBucket = 'construction' | 'other';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  currency: CurrencyCode;
  selectedProjectId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  houseType: string;
  location: string;
  totalBudget: number;
  currency: CurrencyCode;
  startDate: string;
  expectedCompletionDate?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAccess extends Project {
  role: ProjectRole;
}

export type MasterType = 'categories' | 'stages' | 'vendors' | 'units' | 'paymentMethods' | 'paymentStatuses';

export interface MasterItem {
  id: string;
  createdBy?: string;
  updatedBy?: string;
  projectId: string;
  name: string;
  type: MasterType;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  createdBy: string;
  updatedBy?: string;
  projectId: string;
  date: string;
  stageId: string;
  categoryId: string;
  item: string;
  description: string;
  quantity?: number;
  unitId?: string;
  rate?: number;
  amount: number;
  /** Older expenses predate this field and are treated as construction costs. */
  costBucket?: CostBucket;
  paidById: string;
  paymentStatusId: string;
  vendorId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  categoryId: string;
  amount: number;
  /** When absent, this is a legacy construction-category allocation. */
  costBucket?: CostBucket;
}

export interface Budget {
  id: string;
  projectId: string;
  totalBudget: number;
  /** When absent, totalBudget is a legacy construction-only budget. */
  constructionBudget?: number;
  otherBudget?: number;
  categoryBudgets: CategoryBudget[];
  updatedBy?: string;
  updatedAt: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  invitedEmail: string;
  role: ProjectRole;
  status: 'pending' | 'accepted' | 'declined';
  acceptedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  search?: string;
  categoryId?: string;
  stageId?: string;
  vendorId?: string;
  paymentStatusId?: string;
  paidById?: string;
  costBucket?: CostBucket;
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}
