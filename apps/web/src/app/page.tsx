"use client";

import Link from "next/link";
import Image from "next/image";

import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Users, Calendar, HeadphonesIcon,
  ArrowRight, MapPin, Phone, Mail, Building2, Home,
  BookOpen, Clock, ChevronRight, ExternalLink
} from "lucide-react";

import dynamic from "next/dynamic";
const MagicBento = dynamic(() => import("@/components/MagicBento"), { ssr: false });


export default function LandingPage() {
  // "dark" = frosted dark navbar, "light" = white navbar
  const [navTheme, setNavTheme] = useState<"dark" | "light">("dark");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = containerRef.current?.querySelectorAll<HTMLElement>("[data-nav-theme]");
    if (!sections || sections.length === 0) return;

    // The navbar sits ~4px from top + ~56px tall = ~60px zone.
    // We observe which section crosses the top 70px strip of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose top is closest to 0 (i.e. the section currently at the top)
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const theme = (entry.target as HTMLElement).dataset.navTheme as "dark" | "light";
            if (theme) setNavTheme(theme);
          }
        }
      },
      {
        // Only observe the top 70px strip of the viewport
        rootMargin: "0px 0px -95% 0px",
        threshold: 0,
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const els = containerRef.current?.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-stagger]");
    if (!els || els.length === 0) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target); // only animate once
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);

  const isDark = navTheme === "dark";

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-4 left-1/2 z-50 w-[92%] max-w-6xl -translate-x-1/2 rounded-2xl border transition-all duration-500 backdrop-blur-xl ${isDark
          ? "border-white/10 bg-[#0a2240]/60 shadow-2xl shadow-black/30"
          : "border-gray-200/50 bg-white/90 shadow-xl shadow-black/5"
          }`}
      >
        <div className="flex items-center justify-between px-6 py-3.5">
          <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
            <Image
              src={isDark ? "/Mavhousing Logo.svg" : "/Main MavHousing Logo.svg"}
              alt="MavHousing"
              width={34}
              height={34}
              className="rounded-lg"
            />
            <span
              className={`text-[15px] font-bold tracking-tight transition-colors duration-500 ${isDark ? "text-white" : "text-[#0a2240]"
                }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              MavHousing
            </span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {[
              { label: "Housing Options", href: "#housing-options" },
              { label: "Campus Life", href: "#campus-life" },
              { label: "Student Stories", href: "#testimonials" },
              { label: "Resources", href: "#quick-links" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-300 ${isDark
                  ? "text-white/70 hover:text-white"
                  : "text-gray-600 hover:text-[#c75b12]"
                  }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`inline-flex h-9 items-center justify-center rounded-lg px-6 text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${isDark
                ? "bg-white text-[#0a2240] hover:bg-gray-100 hover:shadow-lg"
                : "bg-[#c75b12] text-white hover:bg-[#a84a0e] hover:shadow-md"
                }`}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section data-nav-theme="dark" className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[#061729]">
          {/* Angled gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, #0a2240 0%, #061729 40%, #0d1b2e 70%, #0a2240 100%)
              `,
            }}
          />

          {/* Warm glow — top right */}
          <div
            className="absolute -right-20 -top-20 h-[700px] w-[700px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(199,91,18,0.35) 0%, rgba(199,91,18,0.08) 40%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* Gold glow — left center */}
          <div
            className="absolute -left-32 top-1/3 h-[500px] w-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(240,165,55,0.2) 0%, transparent 65%)',
              filter: 'blur(90px)',
            }}
          />

          {/* Cool accent glow — bottom right */}
          <div
            className="absolute -bottom-20 right-1/4 h-[400px] w-[600px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(77,171,247,0.1) 0%, transparent 60%)',
              filter: 'blur(70px)',
            }}
          />

          {/* Diagonal line texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 40px,
                rgba(255,255,255,0.5) 40px,
                rgba(255,255,255,0.5) 41px
              )`,
            }}
          />

          {/* Subtle noise grain for depth */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Decorative geometric ring — top right */}
          <div className="absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full border border-white/[0.04]" />
          <div className="absolute -right-16 -top-16 h-[400px] w-[400px] rounded-full border border-white/[0.03]" />

          {/* Decorative geometric ring — bottom left */}
          <div className="absolute -bottom-32 -left-32 h-[350px] w-[350px] rounded-full border border-[#c75b12]/[0.08]" />
          <div className="absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full border border-[#f0a537]/[0.06]" />

          {/* Glowing orb accent — mid right */}
          <div className="absolute right-[10%] top-[40%] h-2 w-2 rounded-full bg-[#f0a537] shadow-[0_0_20px_6px_rgba(240,165,55,0.3)]" />
          <div className="absolute left-[15%] top-[60%] h-1.5 w-1.5 rounded-full bg-[#c75b12]/60 shadow-[0_0_15px_4px_rgba(199,91,18,0.2)]" />
          <div className="absolute left-[40%] top-[20%] h-1 w-1 rounded-full bg-white/30 shadow-[0_0_12px_3px_rgba(255,255,255,0.1)]" />

          {/* Bottom fade to next section */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a2240] to-transparent" />
        </div>

        {/* Centered hero content */}
        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <div className="mx-auto w-full max-w-4xl px-6 pt-32 pb-36">

            {/* Announcement pill */}
            <div
              className="landing-fade-in mx-auto mb-12 inline-flex items-center gap-2 rounded-full border border-[#f0a537]/20 px-3.5 py-1.5"
              style={{ background: 'rgba(240,165,55,0.08)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f0a537] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f0a537]" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-[#f0a537]">
                2026–27 Applications Are Open
              </span>
            </div>

            {/* Heading */}
            <h1
              className="landing-fade-in mx-auto max-w-8xl text-[2.25rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-[3.5rem] lg:text-[4.25rem]"
              style={{ fontFamily: 'var(--font-display)', animationDelay: '0.1s' }}
            >
              <span className="whitespace-nowrap">Your Home on Campus</span>
              <br />
              <span
                className="hero-gradient-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #f0a537 0%, #c75b12 50%, #f0a537 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Starts Here.
              </span>
            </h1>

            {/* Divider accent */}
            <div
              className="landing-fade-in mx-auto mt-8 h-1 w-16 rounded-full"
              style={{ background: 'linear-gradient(90deg, #c75b12, #f0a537)', animationDelay: '0.15s' }}
            />

            {/* Subtitle */}
            <p
              className="landing-fade-in mx-auto mt-7 max-w-lg text-base leading-relaxed text-white/55 sm:text-[17px] sm:leading-relaxed"
              style={{ animationDelay: '0.2s' }}
            >
              More than a place to stay — it&apos;s where you meet lifelong friends,
              find academic success, and discover the full Maverick experience.
            </p>

            {/* CTAs */}
            <div className="landing-fade-in mt-10 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/login"
                className="group relative inline-flex h-[52px] items-center gap-2.5 overflow-hidden rounded-xl bg-[#c75b12] px-9 text-[15px] font-bold text-white shadow-lg shadow-[#c75b12]/25 transition-all hover:shadow-xl hover:shadow-[#c75b12]/40 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2.5">
                  Apply for Housing
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#c75b12] to-[#a84a0e] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <Link
                href="/login"
                className="group inline-flex h-[52px] items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.05] px-9 text-[15px] font-bold text-white/90 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-0.5"
              >
                Explore Options
                <ArrowRight className="h-4 w-4 text-white/40 transition-all group-hover:translate-x-1 group-hover:text-white/70" />
              </Link>
            </div>
          </div>

          {/* Stats grid — anchored to bottom */}
          <div className="landing-fade-in absolute bottom-0 left-0 right-0" style={{ animationDelay: '0.5s' }}>
            <div className="grid grid-cols-3 border-t border-white/[0.08]">
              {[
                { value: "90%+", label: "Graduation Rate" },
                { value: "800+", label: "Events / Year" },
                { value: "24/7", label: "Campus Support" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`flex flex-col items-center justify-center py-6 ${i > 0 ? "border-l border-white/[0.08]" : ""
                    }`}
                >
                  <p className="text-lg font-bold tracking-tight text-white sm:text-xl">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-white/30 sm:text-[11px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Housing Options ── */}
      <section data-nav-theme="light" id="housing-options" className="relative bg-[#faf9f7] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div data-reveal className="mb-16 text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#c75b12]">
              Where Will You Live?
            </span>
            <h2
              className="text-3xl font-bold tracking-tight text-[#0a2240] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Great Options on Campus
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Whether you&apos;re a first-year student or a returning Maverick, we have the perfect
              living space to match your lifestyle.
            </p>
          </div>

          <div data-reveal-stagger className="grid gap-8 lg:grid-cols-2">
            {/* Residence Halls */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl">
              <div className="relative h-72 overflow-hidden">
                <Image
                  src="/residence-hall.png"
                  alt="Modern residence hall room"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <span className="rounded-lg bg-[#0a2240]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    Residence Halls
                  </span>
                </div>
              </div>
              <div className="p-7">
                <h3
                  className="mb-3 text-2xl font-bold text-[#0a2240]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Residence Halls
                </h3>
                <p className="mb-5 text-[15px] leading-relaxed text-gray-600">
                  Simply the best place to experience campus life. Perfect for new students to meet
                  lifelong friends, get engaged in on-campus events, and enjoy all-inclusive amenities.
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {["All-Inclusive", "Furnished", "Meal Plans", "24/7 Staff"].map(tag => (
                    <span key={tag} className="rounded-full bg-[#0a2240]/5 px-3 py-1 text-xs font-semibold text-[#0a2240]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a2240] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d2d54]"
                  >
                    Explore <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a2240]/20 px-5 py-2.5 text-sm font-semibold text-[#0a2240] transition-colors hover:bg-[#0a2240]/5"
                  >
                    Compare Rates
                  </Link>
                </div>
              </div>
            </div>

            {/* Apartments */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl">
              <div className="relative h-72 overflow-hidden">
                <Image
                  src="/apartments.png"
                  alt="Student apartment complex"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <span className="rounded-lg bg-[#c75b12]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    Apartments
                  </span>
                </div>
              </div>
              <div className="p-7">
                <h3
                  className="mb-3 text-2xl font-bold text-[#0a2240]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  On-Campus Apartments
                </h3>
                <p className="mb-5 text-[15px] leading-relaxed text-gray-600">
                  The ultimate on-campus student lifestyle. Six distinctive apartment communities with
                  furnished and unfurnished options — independence with the convenience of campus living.
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {["Multiple Communities", "Furnished Options", "Private Bedrooms", "Flexible Leases"].map(tag => (
                    <span key={tag} className="rounded-full bg-[#c75b12]/5 px-3 py-1 text-xs font-semibold text-[#c75b12]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#c75b12] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a84a0e]"
                  >
                    Explore <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#c75b12]/20 px-5 py-2.5 text-sm font-semibold text-[#c75b12] transition-colors hover:bg-[#c75b12]/5"
                  >
                    Compare Rates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Live On Campus? ── */}
      <section data-nav-theme="dark" id="campus-life" className="relative overflow-hidden bg-[#0a2240] py-24">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative mx-auto max-w-7xl px-6">
          <div data-reveal className="mb-16 text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#f0a537]">
              More Than a Place to Stay
            </span>
            <h2
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Housing & Residence Life
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/60">
              Living on campus is where you meet lifelong friends, where you&apos;re just steps away from
              class, and where you find the best chances for academic success.
            </p>
          </div>

          <div className="flex justify-center">
            <MagicBento
              textAutoHide={true}
              enableStars
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={400}
              particleCount={12}
              glowColor="199, 91, 18"
              disableAnimations={false}
            />
          </div>
        </div>
      </section>

      {/* ── Campus Life Image Break ── */}
      <section data-nav-theme="dark" className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="/campus-life.png"
          alt="Students socializing in campus common area"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2240]/70 to-transparent" />
        <div className="relative flex h-full items-center">
          <div className="mx-auto max-w-7xl px-6">
            <blockquote data-reveal className="max-w-lg">
              <p
                className="text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                &ldquo;Housing is where you sleep in, where you&apos;re just steps away from class,
                and where you find the best chances for success.&rdquo;
              </p>
              <cite className="mt-4 block text-sm font-medium not-italic text-white/60">
                — UTA Housing & Residence Life
              </cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Student Stories — Marquee ── */}
      <section data-nav-theme="light" id="testimonials" className="overflow-hidden bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div data-reveal className="mb-14 text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#c75b12]">
              Hear From Our Residents
            </span>
            <h2
              className="text-3xl font-bold tracking-tight text-[#0a2240] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Student Stories
            </h2>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-white to-transparent" />

          <div className="marquee-track flex w-max gap-6 px-6">
            {[...Array(2)].flatMap((_, setIdx) =>
              [
                { name: "Cecillia Nguyen", hall: "West Hall", quote: "West Hall is very convenient to other campus facilities. Everything I need is within walking distance." },
                { name: "Elsi Robles", hall: "Vandergriff Hall", quote: "Everything you need is within walking distance. The convenience of living on campus makes a huge difference." },
                { name: "Josie Martinez", hall: "Arlington Hall", quote: "You are immersed in campus life. There's always something happening and people to connect with." },
                { name: "Ace Cowan", hall: "KC Hall", quote: "They host events for you to play games and meet others. It's the best way to make friends on campus." },
                { name: "Leonee Onyekwer", hall: "West Hall", quote: "In the residence halls I built lasting friendships that I know will stay with me long after graduation." },
              ].map((t, i) => (
                <div
                  key={`${t.name}-${setIdx}-${i}`}
                  className="w-[320px] shrink-0 rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm"
                >
                  <p className="mb-4 text-[15px] leading-relaxed text-gray-500 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a2240]">
                      <span className="text-xs font-bold text-white">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0a2240]">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.hall}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Application CTA ── */}
      <section data-nav-theme="dark" className="relative overflow-hidden bg-[#c75b12] py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/20" />
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-white/10" />
        </div>
        <div data-reveal className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
            <Clock className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">Applications are First-Come, First-Served</span>
          </div>
          <h2
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Get Your Application
            <br />
            Started Today!
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
            With our free application, it&apos;s easy to get started! Housing applications are
            first-come, first-served, so don&apos;t delay and miss your opportunity.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="group inline-flex h-13 items-center gap-2 rounded-lg bg-white px-8 text-sm font-bold text-[#c75b12] shadow-lg transition-all hover:bg-[#faf9f7] hover:shadow-xl"
            >
              Apply Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-13 items-center rounded-lg border-2 border-white/30 px-8 text-sm font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
            >
              Already Have an Account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section data-nav-theme="light" id="quick-links" className="bg-[#faf9f7] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div data-reveal className="mb-12 text-center">
            <h2
              className="text-2xl font-bold tracking-tight text-[#0a2240] sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Housing Resources
            </h2>
          </div>

          <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Building2, title: "Residence Halls", desc: "Explore our residence hall options", href: "/login" },
              { icon: Home, title: "Apartments", desc: "Browse apartment communities", href: "/login" },
              { icon: MapPin, title: "Housing Tours", desc: "Schedule a campus tour", href: "/login" },
              { icon: BookOpen, title: "Housing Forms", desc: "Handbooks and documents", href: "/login" },
            ].map(link => (
              <Link
                key={link.title}
                href={link.href}
                className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-5 transition-all hover:border-[#c75b12]/20 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0a2240]/5 transition-colors group-hover:bg-[#c75b12]/10">
                  <link.icon className="h-5 w-5 text-[#0a2240] transition-colors group-hover:text-[#c75b12]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#0a2240]">{link.title}</p>
                  <p className="text-sm text-gray-500">{link.desc}</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#c75b12]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer data-nav-theme="dark" className="border-t border-[#0a2240]/10 bg-[#0a2240] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div data-reveal-stagger className="grid gap-12 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <Image src="/Main MavHousing Logo.svg" alt="MavHousing" width={32} height={32} className="rounded-lg brightness-200" />
                <div>
                  <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>MavHousing</span>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#f0a537]">
                    UTA Housing & Residence Life
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-white/50">
                University Housing at the University of Texas at Arlington. Your home on campus,
                your community, your journey.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <MapPin className="h-4 w-4 text-[#c75b12]" />
                  <span>University Center Suite 150, 301 W First Street, Arlington, TX 76019</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <Phone className="h-4 w-4 text-[#c75b12]" />
                  <span>Housing: 817-272-2791 · Apartment & Res Life: 817-272-2926</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/50">
                  <Mail className="h-4 w-4 text-[#c75b12]" />
                  <span>Housing@uta.edu · livingoncampus@uta.edu</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Apply Now", "Residence Halls", "Apartments", "Housing Tours",
                  "Dining", "Parents", "Contact Us", "Housing Portal"
                ].map(link => (
                  <Link
                    key={link}
                    href="/login"
                    className="text-sm text-white/50 transition-colors hover:text-[#f0a537]"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-white/30">
                © {new Date().getFullYear()} MavHousing · University of Texas at Arlington · All rights reserved.
              </p>
              <div className="flex gap-4">
                {["Facebook", "Instagram", "Twitter"].map(social => (
                  <a
                    key={social}
                    href="#"
                    className="text-xs text-white/30 transition-colors hover:text-[#f0a537]"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
