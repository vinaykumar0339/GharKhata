export type CurrencyCode = 'INR' | 'USD';
export type PaymentState = 'Paid' | 'Pending' | 'Partially Paid' | 'Advance';
export type ProjectRole = 'admin' | 'editor' | 'viewer';

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
  ownerName?: string;
  name: string;
  description: string;
  houseType: string;
  location: string;
  totalBudget: number;
  currency: CurrencyCode;
  startDate: string;
  expectedCompletionDate?: string;
  status: 'active' | 'completed' | 'archived';
  memberIds: string[];
  memberRoles: Record<string, ProjectRole>;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface ProjectMember {
  userId: string;
  displayName: string;
  updatedAt: string;
}

export type MasterType = 'categories' | 'stages' | 'vendors' | 'units' | 'paymentMethods' | 'paymentStatuses';

export interface MasterItem {
  id: string;
  ownerId: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  projectId: string;
  name: string;
  type: MasterType;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  ownerId: string;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
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
}

export interface Budget {
  id: string;
  ownerId: string;
  projectId: string;
  totalBudget: number;
  categoryBudgets: CategoryBudget[];
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: string;
}

export interface ProjectInvite {
  id: string;
  ownerId: string;
  projectId: string;
  projectName: string;
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
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}
