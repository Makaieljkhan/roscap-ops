import LenderForm from '@/components/LenderForm';
import { PageHeader } from '@/components/ui';

export const metadata = { title: 'Add Lender — Roscap' };

export default function NewLenderPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Lender"
        subtitle="Create a new lender record in the database."
      />
      <LenderForm mode="create" />
    </div>
  );
}
