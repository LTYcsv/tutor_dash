const VARIANTS = {
  green:  'bg-[#DCFCE7] text-[#16A34A]',
  yellow: 'bg-[#FEF9C3] text-[#CA8A04]',
  red:    'bg-[#FEE2E2] text-[#DC2626]',
  blue:   'bg-[#DBEAFE] text-[#2563EB]',
  gray:   'bg-[#F1F5F9] text-[#64748B]'
};

export default function Badge({ variant = 'gray', children, onClick }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current ${VARIANTS[variant]} ${onClick ? 'cursor-pointer hover:brightness-95' : ''}`}
    >
      {children}
    </span>
  );
}
