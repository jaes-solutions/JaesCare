import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ReceiptText,
  CalendarDays,
} from "lucide-react";

import carelogo from "../assets/carelogo.png";
import carelogoLight from "../assets/carelogo-light.png";

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
          className="lg:hidden fixed top-4 left-4 z-[60] w-11 h-11 rounded-xl bg-white dark:bg-[#04070d] border border-black/10 dark:border-white/[0.08] flex items-center justify-center"
        >
          <Menu className="text-black dark:text-white" size={22} />
        </button>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[245px] bg-white dark:bg-[#04070d] border-r border-black/10 dark:border-white/[0.04] flex flex-col justify-between z-50 overflow-hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* TOP SECTION */}
        <div>
          {/* LOGO */}
          <div className="px-5 pt-5 pb-6 flex items-center justify-between gap-4">
            <>
              <img
                src={carelogoLight}
                alt="Care Logo"
                className="w-[140px] object-contain block dark:hidden"
              />

              <img
                src={carelogo}
                alt="Care Logo"
                className="w-[140px] object-contain hidden dark:block"
              />
            </>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden text-black dark:text-white"
            >
              <X size={22} />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="px-4 flex flex-col gap-1.5">
            {/* ACTIVE */}
            <button
              onClick={() => {
                navigate("/adminDashboard");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <LayoutDashboard
                size={18}
                strokeWidth={2.4}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Dashboard
              </span>
            </button>
            <button
              onClick={() => {
                navigate("/adminShifts");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <CalendarDays
                size={18}
                strokeWidth={2}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Shifts
              </span>
            </button>
            {/* ITEMS */}
            <button
              onClick={() => {
                navigate("/adminStaff");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <Users
                size={18}
                strokeWidth={2}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Staff
              </span>
            </button>

            <button
              onClick={() => {
                navigate("/adminPatients");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <ClipboardList
                size={18}
                strokeWidth={2}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Residents
              </span>
            </button>

            <button
              onClick={() => {
                navigate("/adminIncidents");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <AlertTriangle
                size={18}
                strokeWidth={2}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Incidents
              </span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/invoices");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <ReceiptText
                size={18}
                strokeWidth={2}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Invoicing
              </span>
            </button>

            <button
              onClick={() => {
                navigate("/adminSettings");
                setOpen(false);
              }}
              className="group w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
            >
              <Settings
                size={18}
                strokeWidth={2}
                className="text-gray-700 dark:text-[#c8d1dc]"
              />

              <span className="text-[14px] text-gray-900 dark:text-[#eef2f7]">
                Settings
              </span>
            </button>
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="px-4 pb-4">
          <div className="h-px bg-black/10 dark:bg-white/[0.06] mb-5" />

          <button
            onClick={onLogout}
            className="w-full h-[50px] rounded-[15px] flex items-center gap-3 px-4 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all duration-300"
          >
            <LogOut
              size={18}
              strokeWidth={2}
              className="text-gray-700 dark:text-[#c8d1dc]"
            />

            <span className="text-[14px] text-black dark:text-white">
              Log out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
