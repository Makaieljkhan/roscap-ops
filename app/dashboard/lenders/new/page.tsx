import LenderForm from '@/components/LenderForm';

export const metadata = { title: 'Add Lender — Roscap' };

export default function NewLenderPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-[2rem] font-light italic text-[#f0ebe0]">Add Lender</h1>
        <p className="text-[#4a7060] mt-1 text-sm">Create a new lender record in the database.</p>
      </div>
      <div className="bg-[#132019] rounded-xl border border-[#1e3328] p-6">
        <LenderForm mode="create" />
      </div>
    </div>
  );
}
