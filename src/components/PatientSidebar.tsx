import {
  LayoutDashboard,
  User,
  Clock3,
  ClipboardCheck,
  NotebookText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import carelogo from "../assets/carelogo.png";

type SidebarProps = {
  onLogout: () => void;
};

export default function PatientSidebar({ onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
              className="w-[150px] object-contain"
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
            <button
              onClick={() => navigate("/patient-dashboard")}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300"
            >
              <LayoutDashboard
                size={18}
                strokeWidth={2}
                className="text-[#c8d1dc]"
              />
              <span className="text-[15px] font-medium text-[#eef2f7]">
                Dashboard
              </span>
            </button>

            {/* ITEMS */}
            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <User size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">My Profile</span>
            </button>

            <button
              onClick={() => navigate("/patient-records")}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300"
            >
              <Clock3 size={18} strokeWidth={2.2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#c8d1dc] font-medium">
                Care Records
              </span>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <Bell size={18} strokeWidth={2} className="text-[#c8d1dc]" />

              <span className="text-[14px] text-[#eef2f7]">Notifications</span>

              <div className="ml-auto w-6 h-6 rounded-full bg-[#1f6ed4] flex items-center justify-center text-[10px] font-semibold text-white">
                2
              </div>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <ClipboardCheck
                size={18}
                strokeWidth={2}
                className="text-[#c8d1dc]"
              />

              <span className="text-[14px] text-[#eef2f7]">Care Plan</span>
            </button>

            <button className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-all duration-300">
              <NotebookText
                size={18}
                strokeWidth={2}
                className="text-[#c8d1dc]"
              />

              <span className="text-[14px] text-[#eef2f7]">Medical Notes</span>
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
