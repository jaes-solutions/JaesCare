import { ChevronDown, Menu, User, Pencil } from "lucide-react";
import { useState } from "react";

type NavbarProps = {
  name?: string;
  role?: string;
};
export default function Navbar({
  name = "Admin",
  role = "admin",
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  return (
    <header className="fixed top-0 left-0 lg:left-[240px] right-0 min-h-[70px] lg:h-[78px] border-b border-black/10 dark:border-white/[0.05] bg-white/95 dark:bg-[#02050a]/95 backdrop-blur-2xl z-40">
      <div className="h-full min-h-[70px] px-3 sm:px-5 lg:px-7 flex items-center justify-between gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button className="w-10 h-10 rounded-[14px] border border-black/10 dark:border-white/[0.05] bg-black/5 dark:bg-white/[0.03] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/[0.06] transition-all duration-300 lg:hidden">
            <Menu className="text-black dark:text-white" size={24} />
          </button>

          <div>
            <h1 className="text-[16px] sm:text-[20px] lg:text-[24px] leading-tight font-semibold tracking-[-0.03em] text-black dark:text-white truncate max-w-[170px] sm:max-w-none">
              Welcome back, {name}! 👋
            </h1>

            <p className="text-gray-600 dark:text-[#7d8794] text-[10px] sm:text-[11px] mt-0.5 font-medium truncate max-w-[170px] sm:max-w-none">
              Here’s your overview for today.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative">
          {/* PROFILE */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 sm:gap-4 sm:pl-5 sm:border-l border-black/10 dark:border-white/[0.06] hover:opacity-90 transition-all duration-300"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-[#121c28] border border-black/10 dark:border-white/[0.06] flex items-center justify-center text-black dark:text-white text-[14px] font-semibold shadow-inner">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium text-black dark:text-white leading-none">
                {name}
              </p>

              <p className="text-[10px] text-gray-600 dark:text-[#9aa7b5] mt-0.5 capitalize">
                {role}
              </p>
            </div>

            <ChevronDown
              size={16}
              strokeWidth={2.2}
              className="text-gray-600 dark:text-[#9aa7b5] hidden sm:block"
            />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-64 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1722] shadow-2xl p-4 z-50">
              <div className="flex items-center gap-3 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#121c28] flex items-center justify-center font-semibold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-black dark:text-white">
                    {name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {role}
                  </p>
                </div>
              </div>

              <button className="w-full mt-3 flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                <User size={18} />
                <span>View Profile</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                <Pencil size={18} />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
