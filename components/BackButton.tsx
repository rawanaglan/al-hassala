"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ 
  label = "العودة للخلف", 
  href 
}: { 
  label?: string; 
  href?: string; 
}) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#fbf7f0] px-4 py-2 text-xs font-bold text-[#8b6508] shadow-sm transition-all duration-200 hover:bg-[#f3ebd9] hover:shadow"
    >
      <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
      <span>{label}</span>
    </button>
  );
}