import { BarChart3, ChefHat, Coffee, ClipboardList, Gamepad2, Home, Package, ReceiptText, Settings, ShoppingBag } from 'lucide-react';

export function Sidebar({ activeView, onChange }) {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'rentas', label: 'Rentas', icon: Gamepad2 },
    { id: 'monitor', label: 'Monitor', icon: BarChart3 },
    { id: 'cafeteria', label: 'Cafetería', icon: Coffee },
    { id: 'kds', label: 'Cocina', icon: ChefHat },
    { id: 'gastos', label: 'Gastos', icon: ReceiptText },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'catalogo', label: 'Catálogo', icon: ShoppingBag },
    { id: 'ordenes', label: 'Órdenes', icon: ClipboardList },
    { id: 'admin', label: 'Admin', icon: Settings }
  ];
  return (
    <aside className="flex w-full shrink-0 flex-row items-center justify-between bg-brand-dark px-4 py-3 text-brand-light md:min-h-screen md:w-24 md:flex-col md:justify-start md:rounded-r-3xl md:px-2 md:py-6">
      <div className="hidden pb-8 text-center md:block"><div className="mx-auto w-fit rounded-2xl bg-brand-gold p-2 text-brand-dark"><Gamepad2 size={22} /></div><p className="font-accent mt-2 text-[10px]">NEXUS</p></div>
      <nav className="flex w-full justify-around gap-1 md:flex-col md:gap-3">
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onChange(id)} className={`font-accent flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-normal transition ${activeView === id ? 'bg-brand-blue text-brand-light' : 'text-brand-muted hover:bg-white/10'}`}>
            <Icon size={20} /> <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
