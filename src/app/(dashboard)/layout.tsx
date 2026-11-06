import Sidebar from "./components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F7F2] text-[#171717]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#F8F7F2]">
        {children}
      </main>
    </div>
  );
}
