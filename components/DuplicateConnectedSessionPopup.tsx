export default function DuplicateSessionPopup() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <p className="text-body font-medium text-center">
          You already have another tab open. <br />
          Please play on that tab.
        </p>
      </div>
    </div>
  );
}
