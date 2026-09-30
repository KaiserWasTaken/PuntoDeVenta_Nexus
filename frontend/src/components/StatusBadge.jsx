const statusMap = {
  available: { label: 'Libre', classes: 'bg-brand-light text-brand-blue ring-brand-blue/30' },
  occupied: { label: 'Ocupada', classes: 'bg-brand-dark text-brand-gold ring-brand-gold/50' },
  reserved: { label: 'Reservada', classes: 'bg-brand-gold text-brand-dark ring-brand-gold' },
  maintenance: { label: 'Mantenimiento', classes: 'bg-brand-muted text-brand-dark ring-brand-muted' },
  inactive: { label: 'Inactiva', classes: 'bg-brand-muted/60 text-brand-dark/60 ring-brand-muted' }
};

export function StatusBadge({ status }) {
  const config = statusMap[status] || statusMap.inactive;
  return (
    <span className={`font-accent inline-flex rounded-full px-3 py-1 text-[10px] font-normal uppercase ring-1 sm:text-xs ${config.classes}`}>
      {config.label}
    </span>
  );
}
