const VARIANTS = {
  primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA]',
  ghost:   'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
};
const SIZES = {
  md: 'px-4 py-[9px] text-sm',
  sm: 'px-3 py-1.5 text-[13px]'
};

export default function Button({ variant = 'primary', size = 'md', children, onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]}`}
    >
      {children}
    </button>
  );
}
