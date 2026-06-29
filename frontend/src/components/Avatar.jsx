const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-[38px] h-[38px] text-[13px]',
  lg: 'w-16 h-16 text-[22px]'
};

export default function Avatar({ initials = '?', color = '#4F46E5', size = 'md' }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${SIZES[size]}`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}
