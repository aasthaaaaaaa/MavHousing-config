import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center">
          <Image
            src="/ascii-art.png"
            alt="UTA Mavericks"
            width={770}
            height={616}
            className="opacity-80 object-contain"
            priority
          />
        </div>
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
