import LenderForm from '@/components/LenderForm';

export const metadata = { title: 'Add Lender — Roscap' };

export default function NewLenderPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Lender</h1>
        <p className="text-gray-500 mt-1 text-sm">Create a new lender record in the database.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <LenderForm mode="create" />
      </div>
    </div>
  );
}
