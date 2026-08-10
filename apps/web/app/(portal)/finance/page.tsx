import { FinanceManagement } from '@web/features/finance';

// Roles: ADMIN. Finance access is backend-authorized for any future finance staff role.
export default function FinancePage() {
  return <FinanceManagement />;
}
