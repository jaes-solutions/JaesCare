import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bell,
  Activity,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import carelogo from "../assets/carelogo.png";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

type SidebarProps = {
  onLogout: () => void;
};

export default function Sidebar({ onLogout }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[60] w-11 h-11 rounded-xl bg-[#04070d] border border-white/[0.08] flex items-center justify-center"
        >
          <Menu className="text-white" size={22} />
        </button>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[245px] bg-[#04070d] border-r border-white/[0.04] flex flex-col justify-between z-50 overflow-hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* TOP SECTION */}
        <div>
          {/* LOGO */}
          <div className="px-5 pt-5 pb-6 flex items-center justify-between gap-4">
            <img
              src={carelogo}
              alt="Care Logo"
              className="w-[140px] object-contain"
            />
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden text-white"
            >
              <X size={22} />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="px-4 flex flex-col gap-1.5">
            {/* ACTIVE */}
            <button className="w-full h-[50px] rounded-[15px] bg-[#13293f] border border-[#244969] shadow-[0_0_20px_rgba(59,130,246,0.08)] flex items-center gap-3 px-4 text-left transition-all duration-300">
              <div className="w-8 h-8 rounded-[10px] bg-[#17324d] flex items-center justify-center">
                <LayoutDashboard
                  size={18}
                  strokeWidth={2.4}
                  className="text-[#7fc2ff]"
                />
              </div>

              <span className="text-[15px] font-medium text-white">
                Dashboard
              </span>
            </button>

            {/* ITEMS */}
            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <Users size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">Staff</span>
            </button>

            <button
              onClick={() => {
                navigate("/adminPatients");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300"
            >
              <ClipboardList
                size={18}
                strokeWidth={2}
                className="text-[#c8d1dc]"
              />

              <span className="text-[14px] text-[#eef2f7]">Patients</span>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <Bell size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">Notifications</span>

              <div className="ml-auto w-6 h-6 rounded-full bg-[#1f6ed4] flex items-center justify-center text-[10px] font-semibold text-white">
                2
              </div>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <Activity size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">Compliance</span>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <FileText size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">Reports</span>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <Settings size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">Settings</span>
            </button>
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="px-4 pb-4">
          <div className="h-px bg-white/[0.06] mb-5" />

          <button
            onClick={onLogout}
            className="w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300"
          >
            <LogOut size={18} strokeWidth={2} className="text-[#c8d1dc]" />

            <span className="text-[14px] text-white">Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
