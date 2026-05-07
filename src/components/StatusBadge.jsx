export default function StatusBadge({ status }) {
  const cleanStatus = status || "pending";

  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    proses: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    reject: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[cleanStatus] || "bg-gray-100 text-gray-600"
      }`}
    >
      {cleanStatus}
    </span>
  );
}
