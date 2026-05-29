import { Bell, ChevronDown, Menu } from "lucide-react";

type NavbarProps = {
  name?: string;
  role?: string;
};
export default function Navbar({
  name = "Admin",
  role = "admin",
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 lg:left-[275px] right-0 min-h-[70px] lg:h-[78px] border-b border-white/[0.05] bg-[#02050a]/95 backdrop-blur-2xl z-40">
      <div className="h-full min-h-[70px] px-3 sm:px-5 lg:px-7 flex items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button className="w-10 h-10 rounded-[14px] border border-white/[0.05] bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-all duration-300 lg:hidden">
            <Menu className="text-white" size={24} />
          </button>

          <div>
            <h1 className="text-[16px] sm:text-[20px] lg:text-[24px] leading-tight font-semibold tracking-[-0.03em] text-white truncate max-w-[170px] sm:max-w-none">
              Welcome back, {name}! 👋
            </h1>

            <p className="text-[#7d8794] text-[10px] sm:text-[11px] mt-0.5 font-medium truncate max-w-[170px] sm:max-w-none">
              Here’s your overview for today.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* NOTIFICATIONS */}
          <button className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] border border-white/[0.05] bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-all duration-300">
            <Bell size={20} strokeWidth={2.2} className="text-[#d7e1ea]" />

            <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#2f7fff] flex items-center justify-center text-[11px] font-bold text-white border border-[#5ca0ff] shadow-[0_0_18px_rgba(59,130,246,0.35)]">
              2
            </div>
          </button>

          {/* PROFILE */}
          <button className="flex items-center gap-2 sm:gap-4 sm:pl-5 sm:border-l border-white/[0.06] hover:opacity-90 transition-all duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#121c28] border border-white/[0.06] flex items-center justify-center text-white text-[14px] font-semibold shadow-inner">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium text-white leading-none">
                {name}
              </p>

              <p className="text-[10px] text-[#9aa7b5] mt-0.5 capitalize">
                {role}
              </p>
            </div>

            <ChevronDown
              size={16}
              strokeWidth={2.2}
              className="text-[#9aa7b5] hidden sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
