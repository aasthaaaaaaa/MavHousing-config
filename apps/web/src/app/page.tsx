import Link from "next/link";
import Image from "next/image";
import {
  FileText, Wrench, CreditCard, Home, CheckCircle,
  ArrowRight, Users, Shield
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image src="/Main MavHousing Logo.svg" alt="MavHousing" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight">MavHousing</span>
          </div>
          <div className="hidden gap-8 sm:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/60 via-white to-white" />
        <div className="absolute -top-24 -right-24 -z-10 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-32 -left-32 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-100/30 blur-3xl" />

        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                UTA Student Housing Portal
              </span>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  Housing made{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    simple
                  </span>{" "}
                  for Mavericks
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-gray-600">
                  Apply for on-campus housing, track maintenance requests, and manage your payments — all from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                  Apply for housing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-full border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  Log in to your account
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 pt-2">
                {[
                  { value: "500+", label: "Students housed" },
                  { value: "3", label: "Properties" },
                  { value: "24h", label: "Avg. response time" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero image */}
            <div className="relative hidden lg:block">
              <div className="relative h-[440px] w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/hero.png"
                  alt="MavHousing campus building"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-5 -left-6 rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Application approved!</p>
                    <p className="text-xs text-gray-500">Cardinal Commons — Unit 204</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need, in one portal</h2>
            <p className="mt-3 text-gray-600">From applying to moving in — we've got you covered.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                color: "bg-blue-50 text-blue-600",
                title: "Housing Applications",
                desc: "Browse available properties, submit your housing application, and track its status in real time.",
              },
              {
                icon: Wrench,
                color: "bg-orange-50 text-orange-600",
                title: "Maintenance Requests",
                desc: "Report issues in your unit with priority levels and get notified when staff is assigned and resolved.",
              },
              {
                icon: CreditCard,
                color: "bg-green-50 text-green-600",
                title: "Payment Management",
                desc: "View your balance, payment history, and make payments securely — all within the portal.",
              },
              {
                icon: Home,
                color: "bg-purple-50 text-purple-600",
                title: "Lease Tracking",
                desc: "Access your lease documents, view start and end dates, and stay on top of your housing agreement.",
              },
              {
                icon: Users,
                color: "bg-indigo-50 text-indigo-600",
                title: "Staff Portal",
                desc: "Staff and admin have dedicated dashboards to manage applications, leases, maintenance, and payments.",
              },
              {
                icon: Shield,
                color: "bg-rose-50 text-rose-600",
                title: "Secure & Private",
                desc: "Your data is protected with role-based access control — students, staff, and admins each see only what they need.",
              },
            ].map(f => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Get housed in 3 simple steps</h2>
            <p className="mt-3 text-gray-600">The whole process from application to move-in, simplified.</p>
          </div>

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute top-10 left-1/6 right-1/6 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent md:block" />

            {[
              { step: "01", title: "Create an account", desc: "Sign up with your UTA NetID and complete your student profile." },
              { step: "02", title: "Apply for housing", desc: "Choose your preferred property, select your term, and submit your application." },
              { step: "03", title: "Move in!", desc: "Once approved, review your lease, make your first payment, and get your keys." },
            ].map(step => (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-600 shadow-lg">
                  <span className="text-xs font-bold text-blue-100">STEP</span>
                </div>
                <div className="-mt-12 pt-16 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <p className="mb-1 text-xs font-bold tracking-widest text-blue-600">{step.step}</p>
                  <h3 className="mb-2 font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-blue-600 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to find your place on campus?
          </h2>
          <p className="mt-4 text-blue-100">
            Join hundreds of UTA Mavericks who manage their housing through MavHousing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-blue-600 shadow-md transition-all hover:bg-blue-50 hover:shadow-lg"
            >
              Get started — it&apos;s free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-full border border-blue-400 px-7 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Image src="/Main MavHousing Logo.svg" alt="MavHousing" width={28} height={28} className="rounded-lg" />
            <span className="font-bold">MavHousing</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} MavHousing · University of Texas at Arlington · All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
