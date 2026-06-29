import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Clock3,
  FileText,
  ShieldCheck,
  Activity,
  ChevronRight,
  ChevronDown,
  Users,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Send,
} from "lucide-react";
import carelogo from "../assets/carelogo.png";
import carelogoLight from "../assets/carelogo-light.png";

const SITE_URL = "https://care.jaessolutions.com/";

const FEATURES = [
  {
    icon: Clock3,
    accent: "sky",
    title: "Hourly Check-Ins",
    description:
      "Secure, timestamped hourly documentation with automatic late entry tracking, so every wellbeing record is captured the moment it happens.",
  },
  {
    icon: ShieldCheck,
    accent: "emerald",
    title: "Compliance & Security",
    description:
      "Protected records, role-based access and non-editable audit trails built to support regulatory compliance and safeguarding requirements.",
  },
  {
    icon: Activity,
    accent: "sky",
    title: "Real-Time Monitoring",
    description:
      "Live care updates, wellbeing observations and shift handovers, all visible the instant they're logged from the field.",
  },
  {
    icon: Users,
    accent: "emerald",
    title: "HR & Workforce Management",
    description:
      "Centralise staff records, onboarding, training and employee tracking in one workforce management hub built for care teams.",
  },
  {
    icon: Bell,
    accent: "sky",
    title: "Shift Scheduling & Handovers",
    description:
      "Plan rotas, send instant shift reminders and capture structured handover notes for seamless continuity of care.",
  },
  {
    icon: FileText,
    accent: "emerald",
    title: "Care Documentation & Reporting",
    description:
      "Generate audit-ready reports and keep every care plan, observation and incident properly documented and easy to retrieve.",
  },
];

const STATS = [
  { icon: Users, value: "10+", label: "Care Organisations" },
  { icon: Clock3, value: "500+", label: "Check-Ins Logged" },
  { icon: Activity, value: "99.9%", label: "Platform Uptime" },
  { icon: ShieldCheck, value: "24/7", label: "Customer Support" },
];

const STAT_TARGETS = [10, 500, 99.9, 24];

const FAQS = [
  {
    question: "What is JAES Care and who is it for?",
    answer:
      "JAES Care is a cloud-based care management, workforce management and compliance platform built for supported living, domiciliary care, nursing agencies and other healthcare providers. It brings staff scheduling, HR, care documentation and compliance tracking together in one secure system.",
  },
  {
    question: "Does JAES Care support regulatory compliance?",
    answer:
      "Yes. JAES Care includes role-based access controls, non-editable audit trails and structured care documentation designed to help organisations meet regulatory and organisational compliance requirements.",
  },
  {
    question: "Can staff use JAES Care on their phones?",
    answer:
      "Yes. JAES Care is built as a mobile-friendly dashboard, so staff can complete hourly check-ins, documentation and shift handovers from a phone, tablet or desktop while on shift.",
  },
  {
    question: "How secure is patient and staff data?",
    answer:
      "Patient and staff records are protected with role-based access, secure audit logging and encrypted storage, so only authorised users can view or edit sensitive information.",
  },
  {
    question: "Can I change plans or cancel my subscription?",
    answer:
      "Yes. You can move between the Starter and Professional plans as your organisation grows, and Enterprise customers work directly with our team on a tailored agreement. There's no long-term lock-in on monthly plans.",
  },
];

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export default function Home() {
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [selectedLogin, setSelectedLogin] = useState("staff");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const statsRef = useRef<HTMLElement | null>(null);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("access_key", "c62e10dc-56f3-4b5f-857f-fc4261f8ea13");
    formData.append("subject", "New JAES Care Contact Form Submission");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Thank you! Your message has been sent successfully.");
        form.reset();
      } else {
        alert("❌ Unable to send your message. Please try again.");
      }
    } catch {
      alert("❌ Something went wrong. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const duration = 3500;

        const animate = (time: number) => {
          const progress = Math.min((time - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          setCounts([
            STAT_TARGETS[0] * eased,
            STAT_TARGETS[1] * eased,
            STAT_TARGETS[2] * eased,
            STAT_TARGETS[3] * eased,
          ]);

          if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const pageTitle =
    "JAES Care | Care Management, Workforce Management & Compliance Platform";
  const pageDescription =
    "JAES Care is a secure cloud-based platform for supported living, domiciliary care, and nursing agencies. Manage staff, shifts, HR, regulatory compliance, and real-time care monitoring.";

  // Technical Structured Data Schemas
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JAES Solutions",
    url: SITE_URL,
    logo: `${SITE_URL}assets/carelogo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+44-000-000-0000",
      contactType: "customer service",
    },
    sameAs: [
      "https://www.linkedin.com/company/jaes-solutions",
      "https://twitter.com/jaessolutions",
    ],
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "JAES Care",
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: pageDescription,
    provider: {
      "@type": "Organization",
      name: "JAES Solutions",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "14.99",
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Offer",
        name: "Professional",
        price: "25.99",
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          billingDuration: "P1M",
        },
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <html lang="en-GB" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="JAES Care, care management software, workforce management, healthcare software, domiciliary care software, supported living software, HR management, staff scheduling, regulatory compliance, hourly check-ins"
        />
        <meta name="author" content="JAES Solutions" />
        <meta name="theme-color" content="#38bdf8" />

        {/* Open Graph / Social Media Metrics */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="JAES Care" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:image" content={carelogo} />
        <meta property="og:image:alt" content="JAES Care Platform Dashboard" />

        {/* Twitter Metrics */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={carelogo} />

        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <link rel="canonical" href={SITE_URL} />

        {/* AI & Search Engine JSON-LD Injections */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(softwareAppSchema)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Screen Reader Accessibility Bypass Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-sky-400 focus:text-black focus:font-semibold"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-white text-black dark:bg-[#050505] dark:text-white overflow-hidden transition-colors duration-300 font-sans">
        {/* Dynamic Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.12),transparent_40%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header Navigation Module */}
          <header className="fixed top-0 left-0 right-0 z-[1000] h-16 md:h-20 border-b border-white/15 dark:border-white/10 bg-white/55 dark:bg-[#050505]/45 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 dark:supports-[backdrop-filter]:bg-[#050505]/40 shadow-lg shadow-sky-500/5 flex items-center transition-all duration-300">
            <div className="max-w-7xl w-full mx-auto px-4 md:px-6 flex items-center justify-between">
              <a
                href="#home"
                className="flex items-center group"
                aria-label="JAES Care home"
              >
                <img
                  src={carelogoLight}
                  alt="JAES Care logo"
                  className="h-14 md:h-16 w-auto object-contain block dark:hidden transition-transform duration-300 group-hover:scale-105"
                />
                <img
                  src={carelogo}
                  alt="JAES Care logo"
                  className="h-14 md:h-16 w-auto object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105"
                />
              </a>

              <nav
                className="hidden md:flex items-center gap-8 text-sm font-medium"
                aria-label="Primary Navigation"
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="relative text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-sky-400 after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  className="md:hidden p-2 rounded-lg border border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLoginMenu(!showLoginMenu)}
                    aria-haspopup="dialog"
                    aria-expanded={showLoginMenu}
                    aria-controls="login-menu-panel"
                    className="px-4 md:px-6 py-2 md:py-2.5 text-sm rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 text-black font-semibold hover:shadow-lg hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Login
                  </button>

                  {showLoginMenu && (
                    <>
                      <button
                        type="button"
                        aria-label="Close login menu"
                        tabIndex={-1}
                        onClick={() => setShowLoginMenu(false)}
                        className="fixed inset-0 z-[998] cursor-default bg-black/20 backdrop-blur-sm transition-opacity"
                      />

                      <div
                        id="login-menu-panel"
                        role="dialog"
                        aria-label="Sign in options"
                        className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[90px] sm:top-full sm:mt-4 sm:w-[520px] max-h-[80vh] overflow-y-auto rounded-[20px] sm:rounded-[24px] border border-sky-400/20 bg-white dark:bg-[#0d1117] p-4 sm:p-6 shadow-2xl shadow-sky-500/20 z-[999] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
                      >
                        <h3 className="text-sky-500 dark:text-sky-400 text-sm font-semibold tracking-[0.2em] uppercase mb-6 border-b border-black/10 dark:border-white/10 pb-4">
                          Sign In Securely
                        </h3>

                        <div className="space-y-4">
                          {["staff", "admin", "patient"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setSelectedLogin(type)}
                              aria-pressed={selectedLogin === type}
                              className={`group w-full rounded-[16px] border bg-gray-50 dark:bg-[#111827] p-4 text-left transition-all duration-300 hover:shadow-md ${
                                selectedLogin === type
                                  ? type === "admin"
                                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                                    : "border-sky-400 bg-sky-50 dark:bg-sky-900/10"
                                  : "border-black/10 dark:border-white/10 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full transition-colors duration-300 ${
                                    selectedLogin === type
                                      ? type === "admin"
                                        ? "border-[6px] border-emerald-500 bg-white dark:bg-[#0d1117]"
                                        : "border-[6px] border-sky-500 bg-white dark:bg-[#0d1117]"
                                      : "border-[2px] border-gray-400 bg-transparent group-hover:border-gray-500"
                                  }`}
                                />
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 capitalize">
                                    {type} Login
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {type === "staff" &&
                                      "Access hourly check-ins, documentation, shift handovers and daily care workflows."}
                                    {type === "admin" &&
                                      "Manage employees, clients, compliance tracking and organisation settings."}
                                    {type === "patient" &&
                                      "View care updates, wellbeing records and communication securely."}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate("/login")}
                          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 py-3.5 text-base sm:text-lg font-bold text-black shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-300"
                        >
                          Continue to Portal <ArrowRight size={20} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Navigation Panel */}
            {mobileMenuOpen && (
              <nav
                id="mobile-nav"
                aria-label="Mobile Navigation"
                className="md:hidden absolute top-full left-3 right-3 mt-3 z-[1100] rounded-3xl border border-sky-400/20 bg-[#050b16]/95 dark:bg-[#050505]/95 backdrop-blur-3xl p-3 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                {NAV_LINKS.map((link) => (
                  <>
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center rounded-2xl px-4 py-3 text-base font-semibold text-white dark:text-gray-100 hover:bg-sky-500/10 hover:text-sky-300 transition-all duration-300"
                    >
                      {link.label}
                    </a>
                    {link !== NAV_LINKS[NAV_LINKS.length - 1] && (
                      <div className="mx-2 h-px bg-white/10" />
                    )}
                  </>
                ))}
              </nav>
            )}
          </header>

          {/* Semantic Main Content Structure */}
          <main id="main-content" className="flex-grow pt-20 md:pt-24">
            {/* Hero Interactive UI Section */}
            <section
              id="home"
              className="relative z-0 max-w-7xl mx-auto px-6 pt-6 md:pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center"
            >
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-400/20 bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-300 text-sm font-semibold mb-6 shadow-sm">
                  <Activity size={16} className="animate-pulse" />
                  Care Management • Workforce • Compliance
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                  The Complete
                  <span className="block mt-2 bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent">
                    Care Platform
                  </span>
                </h1>

                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl mb-10">
                  Secure cloud-based software helping healthcare providers
                  manage staff, patients, shift scheduling, handovers, and
                  regulatory compliance from one intelligent dashboard.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 text-black font-bold text-lg hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                  >
                    Open Dashboard
                    <ChevronRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("features")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="px-8 py-4 rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 font-semibold text-lg hover:-translate-y-1"
                  >
                    Explore Features
                  </button>
                </div>
              </div>

              {/* Graphical Performance Interface Card */}
              <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-sky-400/30 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/30 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#0d1117]/90 p-8 shadow-2xl shadow-sky-500/10 backdrop-blur-xl transform hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Assigned Client
                      </p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                        Mary Johnson
                      </h3>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 text-sm font-bold border border-emerald-200 dark:border-emerald-400/20 shadow-sm flex items-center">
                      <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Active Shift
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 mb-8">
                    <div className="rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 p-5 transition-colors hover:border-sky-200 dark:hover:border-sky-500/30">
                      <Clock3
                        className="text-sky-500 dark:text-sky-400 mb-3"
                        size={28}
                      />
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Next Check-In
                      </p>
                      <h4 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                        12:00 PM
                      </h4>
                    </div>

                    <div className="rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 p-5 transition-colors hover:border-emerald-200 dark:hover:border-emerald-500/30">
                      <ShieldCheck
                        className="text-emerald-600 dark:text-emerald-300 mb-3"
                        size={28}
                      />
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Compliance Score
                      </p>
                      <h4 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                        98%
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="group rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 p-5 flex items-center justify-between hover:bg-white dark:hover:bg-[#151b23] transition-all cursor-pointer shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-400/10 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                          <FileText size={22} />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white">
                            Hourly Check-In
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Complete wellbeing log
                          </p>
                        </div>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-1">
                        <CheckCircle2 size={16} /> Ready
                      </div>
                    </div>

                    <div className="group rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 p-5 flex items-center justify-between hover:bg-white dark:hover:bg-[#151b23] transition-all cursor-pointer shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-300/10 flex items-center justify-center text-emerald-600 dark:text-emerald-300 group-hover:scale-110 transition-transform">
                          <Bell size={22} />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white">
                            Shift Reminder
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Handover due at 8:00 PM
                          </p>
                        </div>
                      </div>
                      <div className="text-sky-600 dark:text-sky-400 text-sm font-bold flex items-center gap-1">
                        <Clock3 size={16} /> Pending
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Performance Statistics Section */}
            <section
              ref={statsRef}
              aria-label="Platform statistics"
              className="max-w-7xl mx-auto px-6 pb-24"
            >
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0d1117]/50 p-8 shadow-lg backdrop-blur-sm">
                {STATS.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="text-center p-4 hover:-translate-y-1 transition-transform duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sky-50 dark:bg-sky-400/10 flex items-center justify-center text-sky-500 dark:text-sky-400">
                        <Icon size={28} />
                      </div>
                      <dt className="sr-only">{stat.label}</dt>
                      <dd className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        {index === 0
                          ? `${Math.round(counts[0])}+`
                          : index === 1
                            ? `${Math.round(counts[1])}+`
                            : index === 2
                              ? `${counts[2].toFixed(1)}%`
                              : `${Math.round(counts[3])}/7`}
                      </dd>
                      <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </dl>
            </section>

            {/* Platform Feature Matrix Module */}
            <section
              id="features"
              className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20"
            >
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-400/20 bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-300 text-sm font-semibold mb-6">
                  Built For Care Teams
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 dark:text-white">
                  Why Providers Choose
                  <span className="block sm:inline bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent sm:ml-3">
                    JAES Care
                  </span>
                </h2>

                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Everything you need to manage care delivery, empower your
                  workforce, and ensure compliance, united in one secure
                  platform.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  const isSky = feature.accent === "sky";
                  return (
                    <article
                      key={feature.title}
                      className={`group rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ease-out ${
                        isSky
                          ? "hover:border-sky-300 dark:hover:border-sky-400/40 hover:shadow-sky-500/10"
                          : "hover:border-emerald-300 dark:hover:border-emerald-400/40 hover:shadow-emerald-500/10"
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${
                          isSky
                            ? "bg-sky-100 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400"
                            : "bg-emerald-100 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        <Icon size={32} />
                      </div>

                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                        {feature.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                        {feature.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
            {/* JAES Care Brand Statement */}
            <section className="relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gradient-to-b from-sky-50 via-white to-white dark:from-[#030712] dark:via-[#050b16] dark:to-[#030712] py-32 transition-colors duration-300">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(56,189,248,0.16),transparent_260px)] dark:bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(56,189,248,0.22),transparent_240px)] transition-all duration-150 pointer-events-none" />

              <div
                className="relative z-10 max-w-7xl mx-auto px-6 text-center"
                onMouseMove={(e) => {
                  const target = e.currentTarget.parentElement as HTMLElement;
                  const rect = target.getBoundingClientRect();
                  target.style.setProperty("--x", `${e.clientX - rect.left}px`);
                  target.style.setProperty("--y", `${e.clientY - rect.top}px`);
                }}
              >
                <p className="uppercase tracking-[0.4em] text-sky-600 dark:text-sky-400 font-semibold mb-6">
                  Built for Modern Care Providers
                </p>

                <h2 className="text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tight leading-none bg-gradient-to-r from-slate-900 via-sky-600 to-emerald-600 dark:from-white dark:via-sky-300 dark:to-emerald-300 bg-clip-text text-transparent select-none transition-transform duration-300 hover:scale-[1.02]">
                  JAES CARE
                </h2>

                <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Secure care management, workforce management, compliance and
                  documentation—built to help care organisations deliver
                  exceptional care with confidence.
                </p>
              </div>
            </section>

            {/* Corporate Tier Packages Section */}
            <section
              id="pricing"
              className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20 mt-10"
            >
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-300/20 bg-emerald-50 dark:bg-emerald-300/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-6">
                  Flexible Pricing
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 dark:text-white">
                  Simple Pricing For
                  <span className="block sm:inline bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent sm:ml-3">
                    Care Providers
                  </span>
                </h2>

                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Choose a secure care documentation plan designed for supported
                  living, home care, and healthcare teams of all sizes.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 items-center">
                {/* Starter Tier */}
                <div className="rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-10 relative overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />

                  <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                    Starter
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">
                    Perfect for small, emerging care teams.
                  </p>

                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-6xl font-extrabold text-gray-900 dark:text-white">
                      £14.99
                    </span>
                    <span className="text-gray-500 font-medium">/ month</span>
                  </div>

                  <ul className="space-y-5 text-gray-700 dark:text-gray-300 mb-10 text-lg">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-sky-500" size={20} />{" "}
                      Minimum 5 Users
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-sky-500" size={20} /> Basic
                      Invoicing Support
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-sky-500" size={20} />{" "}
                      Standard Staff Portal
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-sky-500" size={20} /> Mobile
                      Friendly Web-App
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 font-bold text-lg text-gray-900 dark:text-white"
                  >
                    Get Started
                  </button>
                </div>

                {/* Professional Tier (Highlighted) */}
                <div className="rounded-[2.5rem] border-2 border-sky-400 dark:border-sky-400/50 bg-gradient-to-b from-sky-50 to-white dark:from-sky-900/20 dark:to-[#0d1117] p-10 relative overflow-hidden shadow-2xl shadow-sky-500/20 lg:scale-105 z-10 group">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-sky-400/20 blur-[80px] rounded-full transition-transform group-hover:scale-125 duration-700" />

                  <div className="inline-flex px-4 py-1.5 rounded-full bg-sky-500 text-white dark:bg-sky-400/20 dark:text-sky-300 text-sm font-bold tracking-wide uppercase mb-6 shadow-sm">
                    Most Popular
                  </div>

                  <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                    Professional
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-8 font-medium">
                    Ideal for growing care companies needing more power.
                  </p>

                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-6xl font-extrabold text-gray-900 dark:text-white">
                      £25.99
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      / month
                    </span>
                  </div>

                  <ul className="space-y-5 text-gray-800 dark:text-gray-200 mb-10 text-lg font-medium">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />{" "}
                      Minimum 5 Users
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} /> HR
                      & Workforce Management
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />{" "}
                      Advanced Compliance Reporting
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />{" "}
                      Patient & Family App Access
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" size={20} />{" "}
                      Priority 24/7 Support
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-400 text-black font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    Contact Us!
                  </button>
                </div>

                {/* Enterprise Custom Solutions Tier */}
                <div className="rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-10 relative overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />

                  <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                    Enterprise
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">
                    Custom solutions for large healthcare networks.
                  </p>

                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                      Custom
                    </span>
                  </div>

                  <ul className="space-y-5 text-gray-700 dark:text-gray-300 mb-10 text-lg">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-gray-400" size={20} />{" "}
                      Unlimited Users
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-gray-400" size={20} />{" "}
                      Custom API Integrations
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-gray-400" size={20} />{" "}
                      Dedicated Account Manager
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="text-gray-400" size={20} />{" "}
                      White-label Options
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 font-bold text-lg text-gray-900 dark:text-white"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </section>

            {/* Interactive Secure Contact Section Module */}
            <section
              id="contact"
              className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20"
            >
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-400/20 bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-300 text-sm font-semibold mb-6">
                  Get In Touch
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 dark:text-white">
                  Let's Talk About Your
                  <span className="block sm:inline bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent sm:ml-3">
                    Care Team
                  </span>
                </h2>

                <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Have questions about our platform, pricing, or compliance
                  tools? Our team is here to help you find the right solution.
                </p>
              </div>

              <div className="grid lg:grid-cols-5 gap-12 items-start">
                {/* Information Callout Columns */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="group rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-400/10 flex items-center justify-center text-sky-500 dark:text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                      <Mail size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Chat with Us!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Speak to our friendly team about upgrading your care
                      software.
                    </p>
                    <a
                      href="mailto:care@jaessolutions.com"
                      className="text-sky-500 font-semibold hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      care@jaessolutions.com
                    </a>
                  </div>

                  <div className="group rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                      <Phone size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Call Us
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Fast support for all inquiries.
                    </p>
                    <a
                      href="tel:+44 1279 217307"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      +44 1279 217307
                    </a>
                  </div>

                  <div className="group rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4 group-hover:scale-110 transition-transform">
                      <MapPin size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Our Office
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Devonshire House, 582 Honeypot Lane
                      <br />
                      Stanmore, England, HA7 1JS
                      <br />
                      United Kingdom
                    </p>
                  </div>
                </div>

                {/* Secure Communication Form Submission Interface */}
                <div className="lg:col-span-3 rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0d1117]/50 p-8 sm:p-10 shadow-lg backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-400/10 blur-[100px] rounded-full pointer-events-none" />

                  <form
                    className="relative z-10 space-y-6"
                    onSubmit={handleContactSubmit}
                  >
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="firstName"
                          className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="first_name"
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                          placeholder="First Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="lastName"
                          className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="last_name"
                          className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        Work Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                        placeholder="Enter your Email Address"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="company"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        placeholder="Enter your Organisation Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        How can we help?
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-none"
                        placeholder="Tell us about your team size and requirements..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full group flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 text-black font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sending ? "Sending..." : "Send Message"}
                      <Send
                        size={18}
                        className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                      />
                    </button>
                  </form>
                </div>
              </div>
            </section>
            {/* Professional FAQ Section */}
            <section
              id="faq"
              className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20"
            >
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-400/20 bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-300 text-sm font-semibold mb-6">
                  Frequently Asked Questions
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Everything You Need to Know About
                  <span className="block sm:inline bg-gradient-to-r from-sky-500 to-emerald-400 bg-clip-text text-transparent sm:ml-3">
                    JAES Care
                  </span>
                </h2>

                <p className="max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  Find answers to the most common questions about JAES Care,
                  implementation, security, compliance and how our platform
                  helps care organisations deliver exceptional care.
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-5">
                {FAQS.map((faq, index) => {
                  const open = openFaqIndex === index;

                  return (
                    <div
                      key={faq.question}
                      className={`overflow-hidden rounded-[1.75rem] border transition-all duration-300 ${
                        open
                          ? "border-sky-400 bg-sky-50/60 dark:bg-sky-400/5 shadow-xl shadow-sky-500/10"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d1117] hover:border-sky-300 dark:hover:border-sky-400/30"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(open ? -1 : index)}
                        className="w-full flex items-center justify-between gap-6 text-left px-8 py-7"
                      >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {faq.question}
                        </h3>

                        <ChevronDown
                          size={24}
                          className={`flex-shrink-0 text-sky-500 transition-transform duration-300 ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div
                        className={`grid transition-all duration-500 ease-in-out ${
                          open
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-8 pb-8 text-lg leading-8 text-gray-600 dark:text-gray-400">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>

          {/* Deep Architectural Structural Corporate Footer */}
          <footer className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#080b10] pt-20 pb-10 mt-auto relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              {/* Identity Pillar */}
              <div className="space-y-2">
                <a
                  href="#home"
                  className="inline-block leading-none"
                  aria-label="JAES Care home"
                >
                  <img
                    src={carelogoLight}
                    alt="JAES Care logo"
                    className="h-24 w-auto block dark:hidden"
                  />
                  <img
                    src={carelogo}
                    alt="JAES Care logo"
                    className="h-24 w-auto hidden dark:block"
                  />
                </a>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Empowering healthcare providers with intelligent tools for
                  workforce management, care documentation, and strict
                  compliance.
                </p>
              </div>

              {/* Functional Domain Directory Links */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Platform
                </h4>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="#features"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      Compliance & Security
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      Documentation
                    </a>
                  </li>
                </ul>
              </div>

              {/* Corporate Identity Directories */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Company
                </h4>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      FAQ & Support
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-sky-500 transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>

              {/* Direct Communications Matrix */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                  Get in Touch
                </h4>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Mail size={18} className="text-sky-500" />{" "}
                    care@jaessolutions.com
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Phone size={18} className="text-sky-500" /> +44 1279 217307
                  </li>
                  <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                    <MapPin
                      size={18}
                      className="text-sky-500 mt-1 flex-shrink-0"
                    />
                    <span>
                      Devonshire House, 582 Honeypot Lane
                      <br />
                      Stanmore, England, HA7 1JS
                      <br />
                      United Kingdom
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright and Security Endorsement Module */}
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} JAES Solutions Ltd. All rights
                reserved.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                Designed for{" "}
                <ShieldCheck size={16} className="text-emerald-500" /> secure
                care.
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
