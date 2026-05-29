import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Clock3,
  FileText,
  ShieldCheck,
  Activity,
  ChevronRight,
} from "lucide-react";
import carelogo from "../assets/carelogo.png";

export default function Home() {
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [selectedLogin, setSelectedLogin] = useState("staff");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.12),transparent_30%)]" />

      <div className="relative z-10">
        <header className="relative z-[100] h-20 border-b border-white/10 backdrop-blur-sm bg-black/80 flex items-center">
          <div className="max-w-7xl w-full mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={carelogo}
                alt="JAES Care Logo"
                className="h-20 w-auto object-contain -mt-1"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold hover:scale-105 transition-all duration-300"
              >
                Login
              </button>

              {showLoginMenu && (
                <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[90px] sm:top-full sm:mt-4 sm:w-[520px] max-h-[80vh] overflow-y-auto rounded-[20px] sm:rounded-[24px] border border-sky-400/20 bg-[#0d1117] p-4 sm:p-5 shadow-2xl shadow-sky-500/20 z-[999] backdrop-blur-xl">
                  <h3 className="text-sky-300 text-sm font-semibold tracking-[0.2em] uppercase mb-6 border-b border-white/10 pb-4">
                    Sign In
                  </h3>

                  <div className="space-y-5">
                    <button
                      onClick={() => setSelectedLogin("staff")}
                      className={`w-full rounded-[16px] sm:rounded-[20px] border bg-[#111827] p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] ${
                        selectedLogin === "staff"
                          ? "border-sky-400/40"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-5">
                        <div
                          className={`mt-1 w-7 h-7 rounded-full bg-[#0d1117] ${
                            selectedLogin === "staff"
                              ? "border-[4px] border-sky-500"
                              : "border-[1px] border-gray-500"
                          }`}
                        />

                        <div>
                          <h4 className="text-lg sm:text-2xl font-bold text-white mb-2">
                            Staff Login
                          </h4>

                          <p className="text-gray-400 text-sm sm:text-base leading-6">
                            Access hourly check-ins, documentation, shift
                            handovers and daily care workflows.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedLogin("admin")}
                      className={`w-full rounded-[16px] sm:rounded-[20px] border bg-[#111827] p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] ${
                        selectedLogin === "admin"
                          ? "border-emerald-300/40"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-5">
                        <div
                          className={`mt-1 w-7 h-7 rounded-full bg-[#0d1117] ${
                            selectedLogin === "admin"
                              ? "border-[4px] border-emerald-400"
                              : "border-[1px] border-gray-500"
                          }`}
                        />

                        <div>
                          <h4 className="text-lg sm:text-2xl font-bold text-white mb-2">
                            Admin Login
                          </h4>

                          <p className="text-gray-400 text-sm sm:text-base leading-6">
                            Manage employees, clients, compliance tracking and
                            organisation settings.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedLogin("patient")}
                      className={`w-full rounded-[16px] sm:rounded-[20px] border bg-[#111827] p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] ${
                        selectedLogin === "patient"
                          ? "border-sky-400/40"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-5">
                        <div
                          className={`mt-1 w-7 h-7 rounded-full bg-[#0d1117] ${
                            selectedLogin === "patient"
                              ? "border-[4px] border-sky-500"
                              : "border-[1px] border-gray-500"
                          }`}
                        />

                        <div>
                          <h4 className="text-lg sm:text-2xl font-bold text-white mb-2">
                            Patient Login
                          </h4>

                          <p className="text-gray-400 text-sm sm:text-base leading-6">
                            View care updates, wellbeing records and
                            communication securely.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => navigate("/login")}
                    className="mt-6 w-full rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-300 py-3 text-base sm:text-lg font-bold text-black shadow-lg shadow-sky-500/20 hover:scale-[1.01] transition-all duration-300"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="relative z-0 max-w-7xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300 text-sm mb-6">
              <Activity size={16} />
              Real-Time Care Monitoring
            </div>

            <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Modern Care
              <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
                {" "}
                Documentation
              </span>
              <br />
              Built For Care Staff.
            </h2>

            <p className="text-gray-400 text-lg leading-8 max-w-xl mb-10">
              JAES Care helps support workers complete hourly check-ins,
              handovers, wellbeing monitoring, and real-time documentation with
              secure timestamp tracking.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="px-7 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-sky-500/20 flex items-center gap-2">
                Open Dashboard
                <ChevronRight size={18} />
              </button>

              <button className="px-7 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 font-medium">
                View Features
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-sky-400/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-300/20 blur-3xl rounded-full" />

            <div className="relative rounded-3xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-gray-400 text-sm">Assigned Client</p>
                  <h3 className="text-2xl font-bold mt-1">Mary Johnson</h3>
                </div>

                <div className="px-4 py-2 rounded-full bg-emerald-400/15 text-emerald-300 text-sm font-medium border border-emerald-400/20">
                  Active Shift
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl bg-black/40 border border-white/5 p-5">
                  <Clock3 className="text-sky-400 mb-3" size={24} />
                  <p className="text-gray-400 text-sm">Next Check-In</p>
                  <h4 className="text-2xl font-bold mt-1">12:00 PM</h4>
                </div>

                <div className="rounded-2xl bg-black/40 border border-white/5 p-5">
                  <ShieldCheck className="text-emerald-300 mb-3" size={24} />
                  <p className="text-gray-400 text-sm">Compliance</p>
                  <h4 className="text-2xl font-bold mt-1">98%</h4>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-black/40 border border-white/5 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                      <FileText size={22} />
                    </div>

                    <div>
                      <h5 className="font-semibold">Hourly Check-In</h5>
                      <p className="text-sm text-gray-400">
                        Complete wellbeing documentation
                      </p>
                    </div>
                  </div>

                  <div className="text-emerald-300 text-sm font-medium">
                    Ready
                  </div>
                </div>

                <div className="rounded-2xl bg-black/40 border border-white/5 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-300/10 flex items-center justify-center text-emerald-300">
                      <Bell size={22} />
                    </div>

                    <div>
                      <h5 className="font-semibold">Shift Reminder</h5>
                      <p className="text-sm text-gray-400">
                        Handover due at 8:00 PM
                      </p>
                    </div>
                  </div>

                  <div className="text-sky-300 text-sm font-medium">
                    Pending
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-7 hover:border-sky-400/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-sky-400/10 text-sky-400 flex items-center justify-center mb-5">
                <Clock3 size={28} />
              </div>

              <h3 className="text-2xl font-bold mb-3">Hourly Check-Ins</h3>

              <p className="text-gray-400 leading-7">
                Secure timestamped hourly documentation with automatic late
                entry tracking.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-7 hover:border-emerald-300/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-300/10 text-emerald-300 flex items-center justify-center mb-5">
                <ShieldCheck size={28} />
              </div>

              <h3 className="text-2xl font-bold mb-3">Compliance & Security</h3>

              <p className="text-gray-400 leading-7">
                Protected records, role-based access, and non-editable audit
                trails for safeguarding.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-7 hover:border-sky-400/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-sky-400/10 text-sky-400 flex items-center justify-center mb-5">
                <Activity size={28} />
              </div>

              <h3 className="text-2xl font-bold mb-3">Real-Time Monitoring</h3>

              <p className="text-gray-400 leading-7">
                Live care updates, wellbeing observations, and shift handovers
                in one platform.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-300 text-sm mb-5">
              Flexible Pricing
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Simple Pricing For
              <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
                {" "}
                Care Providers
              </span>
            </h2>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-8">
              Choose a secure care documentation plan designed for supported
              living, home care, and healthcare teams.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/10 blur-3xl rounded-full" />

              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-400 mb-8">
                Perfect for small care teams.
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold">£14.99</span>
                <span className="text-gray-400 ml-2">/ month</span>
              </div>

              <div className="space-y-4 text-gray-300 mb-10">
                <div>✓ Minimum 5 Users</div>
                <div>✓ Invoicing support</div>
                <div>✓ Staff Login Access</div>
                <div>✓ Mobile Friendly Dashboard</div>
              </div>

              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold">
                Get Started
              </button>
            </div>

            <div className="rounded-3xl border border-sky-400/30 bg-gradient-to-b from-sky-400/10 to-emerald-300/10 p-8 relative overflow-hidden shadow-2xl shadow-sky-500/10 scale-[1.03]">
              <div className="absolute top-0 right-0 w-44 h-44 bg-sky-400/20 blur-3xl rounded-full" />

              <div className="inline-flex px-4 py-1 rounded-full bg-sky-400/15 text-sky-300 text-sm border border-sky-400/20 mb-5">
                Most Popular
              </div>

              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-300 mb-8">
                Ideal for growing care companies.
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold">£25.99</span>
                <span className="text-gray-300 ml-2">/ month</span>
              </div>

              <div className="space-y-4 text-gray-200 mb-10">
                <div className="space-y-4 text-gray-200 mb-10">
                  <div>✓ Minimum 5 users</div>
                  <div>✓ HR Management System</div>
                  <div>✓ Staff Records & Employee Tracking</div>
                  <div>✓ Real-Time Notifications</div>
                  <div>✓ Secure Audit Logs</div>
                  <div>✓ Invoicing Support</div>
                </div>
              </div>

              <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-bold hover:scale-[1.02] transition-all duration-300">
                Start Professional Plan
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-8 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-300/10 blur-3xl rounded-full" />

              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-400 mb-8">
                Built for large healthcare organisations.
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold">Custom</span>
              </div>

              <div className="space-y-4 text-gray-300 mb-10">
                <div>✓ Custom Integrations</div>
                <div>✓ Dedicated Support</div>
                <div>✓ Advanced Reporting</div>
                <div>✓ Enterprise Security</div>
              </div>

              <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold">
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-28">
          <div className="relative overflow-hidden rounded-[40px] border border-sky-400/20 bg-gradient-to-br from-sky-400/10 via-[#0d1117] to-emerald-300/10 p-10 md:p-16">
            <div className="absolute top-0 left-0 w-72 h-72 bg-sky-400/20 blur-3xl rounded-full" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-300/20 blur-3xl rounded-full" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300 text-sm mb-6">
                  Trusted Care Technology
                </div>

                <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Ready To Modernise
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
                    {" "}
                    Care Documentation?
                  </span>
                </h2>

                <p className="text-lg text-gray-300 leading-8 mb-8">
                  Empower your care staff with real-time hourly check-ins,
                  secure documentation, shift handovers, and modern healthcare
                  workflows designed for supported living and home care teams.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-bold hover:scale-105 transition-all duration-300 shadow-xl shadow-sky-500/20">
                    Start Free Trial
                  </button>

                  <button className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 font-semibold text-white">
                    Book Demo
                  </button>
                </div>
              </div>

              <div className="relative w-full max-w-md">
                <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl shadow-sky-500/10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-gray-400 text-sm">
                        Active Documentation
                      </p>
                      <h3 className="text-3xl font-bold mt-2">98.7%</h3>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-300 flex items-center justify-center text-black text-2xl font-bold shadow-lg shadow-sky-500/20">
                      ✓
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-300">Hourly Check-Ins</span>
                        <span className="text-sky-300">100%</span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-sky-400 to-emerald-300 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-300">Shift Handovers</span>
                        <span className="text-emerald-300">96%</span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-[96%] bg-gradient-to-r from-sky-400 to-emerald-300 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-300">Compliance Rate</span>
                        <span className="text-sky-300">99%</span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full w-[99%] bg-gradient-to-r from-sky-400 to-emerald-300 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
