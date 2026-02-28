import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Sign In | MavHousing",
  description: "Sign in to your MavHousing portal",
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-2 lg:grid-cols-3 bg-white">
      {/* Left side: branding & image (hidden on small screens) */}
      <div className="relative hidden md:flex lg:col-span-2 flex-col justify-between bg-[#0a2240] p-10 text-white overflow-hidden">
        {/* Subtle pattern background */}
        <div className="absolute -inset-[60px] opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/residence-hall.png"
            alt="Campus Residence Hall"
            fill
            className="object-cover opacity-20 select-none pointer-events-none"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0a2240] via-[#0a2240]/80 to-transparent" />
        </div>

        <div className="relative z-10 landing-fade-in" style={{ animationDelay: '0.1s' }}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2.5 landing-fade-in" style={{ animationDelay: '0.2s' }}>
            <Image src="/Mavhousing Logo.svg" alt="MavHousing" width={48} height={48} className="rounded-xl shadow-lg" />
            <span className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              MavHousing
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 landing-fade-in" style={{ animationDelay: '0.3s', fontFamily: 'var(--font-display)' }}>
            Your Home on Campus.
          </h1>
          <p className="text-lg text-white/80 leading-relaxed landing-fade-in" style={{ animationDelay: '0.4s' }}>
            Welcome to the University of Texas at Arlington housing portal.
            Sign in to apply for housing, manage your assignment, and connect with your campus community.
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex items-center justify-center bg-[#faf9f7] p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="mb-10 flex flex-col items-center md:hidden landing-fade-in" style={{ animationDelay: '0.2s' }}>
            <Image src="/Main MavHousing Logo.svg" alt="MavHousing" width={64} height={64} className="mb-4 rounded-xl shadow-sm" />
            <span className="text-2xl font-bold tracking-tight text-[#0a2240]" style={{ fontFamily: 'var(--font-display)' }}>
              MavHousing
            </span>
          </div>

          <LoginForm />

        </div>
      </div>
    </div>
  )
}
