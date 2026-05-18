'use client';

interface Props {
  lenderId: string;
  lenderName: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export default function DeleteLenderButton({ lenderId, lenderName, deleteAction }: Props) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={lenderId} />
      <button
        type="submit"
        className="text-xs text-red-400 hover:text-red-600"
        onClick={(e) => {
          if (!confirm(`Delete "${lenderName}"?`)) e.preventDefault();
        }}
      >
        Delete
      </button>
    </form>
  );
}
