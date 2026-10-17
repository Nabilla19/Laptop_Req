import Link from "next/link";

// Data mock — akan diganti dengan fetch dari DB
const MOCK_LAPTOPS = [
  { id: "1", company: "Apple", product: "MacBook Pro 13", type: "Ultrabook", cpu: "Intel Core i5 2.3GHz", ram: 8, storage: "128GB SSD", gpu: "Intel Iris Plus 640", os: "macOS", weight: 1.37, price: 1339.69, cpuScore: 63 },
  { id: "2", company: "Apple", product: "MacBook Air", type: "Ultrabook", cpu: "Intel Core i5 1.8GHz", ram: 8, storage: "128GB Flash", gpu: "Intel HD 6000", os: "macOS", weight: 1.34, price: 898.94, cpuScore: 63 },
  { id: "3", company: "HP", product: "250 G6", type: "Notebook", cpu: "Intel Core i5 7200U", ram: 8, storage: "256GB SSD", gpu: "Intel HD 620", os: "No OS", weight: 1.86, price: 575.00, cpuScore: 65 },
  { id: "4", company: "Dell", product: "XPS 13", type: "Ultrabook", cpu: "Intel Core i5 8250U", ram: 8, storage: "128GB SSD", gpu: "Intel UHD 620", os: "Windows 10", weight: 1.22, price: 979.00, cpuScore: 70 },
  { id: "5", company: "Asus", product: "ZenBook UX430UN", type: "Ultrabook", cpu: "Intel Core i7 8550U", ram: 16, storage: "512GB SSD", gpu: "Nvidia GeForce MX150", os: "Windows 10", weight: 1.3, price: 1495.00, cpuScore: 85 },
  { id: "6", company: "Lenovo", product: "IdeaPad 320", type: "Notebook", cpu: "Intel Core i3 7100U", ram: 8, storage: "1TB HDD", gpu: "Nvidia GeForce 940MX", os: "No OS", weight: 2.2, price: 499.00, cpuScore: 48 },
  { id: "7", company: "Acer", product: "Aspire 3", type: "Notebook", cpu: "Intel Core i3 7130U", ram: 4, storage: "1TB HDD", gpu: "Intel HD 620", os: "Linux", weight: 2.1, price: 367.00, cpuScore: 48 },
  { id: "8", company: "Dell", product: "Inspiron 7577", type: "Gaming", cpu: "Intel Core i7 7700HQ", ram: 16, storage: "256GB SSD + 1TB HDD", gpu: "Nvidia GeForce GTX 1060", os: "Windows 10", weight: 2.65, price: 1499.00, cpuScore: 80 },
];

const companyColors: Record<string, string> = {
  Apple: "bg-slate-800 text-white",
  HP: "bg-blue-600 text-white",
  Dell: "bg-blue-800 text-white",
  Asus: "bg-indigo-600 text-white",
  Lenovo: "bg-red-600 text-white",
  Acer: "bg-emerald-600 text-white",
  MSI: "bg-red-700 text-white",
  Samsung: "bg-sky-600 text-white",
};

export default function LaptopsPage() {
  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
            Dataset
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Data Laptop</h1>
          <p className="text-sm text-slate-500 mt-1">
            1.303 laptop dari 19 merek
          </p>
        </div>
        <Link
          href="/recommendation"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          ✦ Rekomendasikan
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
            <span className="text-slate-400 text-sm">⊙</span>
            <input
              placeholder="Cari laptop, merek, prosesor..."
              className="bg-transparent text-sm text-slate-700 outline-none flex-1 placeholder:text-slate-400"
              readOnly
            />
          </div>
        </div>
        {["Semua Merek", "Semua Tipe", "Semua OS"].map((f) => (
          <select
            key={f}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 bg-white outline-none cursor-pointer"
          >
            <option>{f}</option>
          </select>
        ))}
        <div className="text-xs text-slate-400 ml-auto">
          Menampilkan 8 dari 1.303
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Laptop
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Prosesor
              </th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                RAM
              </th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Skor CPU
              </th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Berat
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Harga
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_LAPTOPS.map((laptop) => {
              const badgeClass = companyColors[laptop.company] ?? "bg-slate-200 text-slate-700";
              return (
                <tr key={laptop.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${badgeClass}`}>
                        {laptop.company.slice(0, 3).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{laptop.product}</p>
                        <p className="text-xs text-slate-400">{laptop.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-slate-700 text-xs leading-relaxed max-w-[180px] truncate">{laptop.cpu}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{laptop.gpu.split(" ").slice(0, 3).join(" ")}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">
                      {laptop.ram} GB
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-slate-700">{laptop.cpuScore}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${laptop.cpuScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-medium ${laptop.weight <= 1.5 ? "text-emerald-600" : laptop.weight <= 2 ? "text-amber-600" : "text-red-500"}`}>
                      {laptop.weight} kg
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-slate-800">€{laptop.price.toLocaleString("de-DE")}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="border-t border-slate-100 px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs text-slate-400">Halaman 1 dari 163</p>
          <div className="flex gap-2">
            {["← Sebelumnya", "1", "2", "3", "...", "163", "Berikutnya →"].map((p) => (
              <button
                key={p}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${p === "1"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="mt-4 text-xs text-slate-400 text-center">
        Data bersumber dari Kaggle &quot;Laptop Price Dataset&quot; — 1.303 baris, 13 kolom. Harga dalam Euro (€).
      </p>
    </div>
  );
}
