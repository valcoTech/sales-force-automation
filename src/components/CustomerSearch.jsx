import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useOrderStore } from "../store/useOrderStore";

export default function CustomerSearch({ onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setCustomer } = useOrderStore();
  const [keyword, setKeyword] = useState("");

  const handleSearch = async (value) => {
    setKeyword(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .ilike("customer_name", `%${value}%`)
      .limit(10);
    if (!error) setResults(data);
    setLoading(false);
  };
  const handleSelect = (customer) => {
    setCustomer(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold">Pilih Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <input
          type="text"
          autoFocus
          className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          placeholder="Ketik nama customer..."
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {/* Loading */}
        {loading && (
          <p className="text-sm text-gray-400 text-center py-2">Mencari...</p>
        )}

        {/* Hasil pencarian */}
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {results.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelect(customer)}
              className="text-left px-4 py-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
            >
              <p className="text-sm font-medium">{customer.customer_name}</p>
              <p className="text-xs text-gray-400">{customer.customer_id}</p>
            </button>
          ))}

          {/* Tidak ditemukan */}
          {keyword.length >= 2 && results.length === 0 && !loading && (
            <p className="text-sm text-gray-400 text-center py-4">
              Customer tidak ditemukan
            </p>
          )}

          {/* Belum ketik */}
          {keyword.length < 2 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Ketik minimal 2 huruf untuk mencari
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
