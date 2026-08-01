"use client"

import { useState, Suspense, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, User, Store, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"
import { useAuth, type ApiError } from "@/lib/auth-context"
import { api } from "@/lib/api"

type AuthMode = "login" | "register" | "seller" | "otp"

type BusinessCategory = {
  id: string
  name: string
  description: string | null
}

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

function AuthFormInner({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login, register, registerSeller, sendOtp, verifyOtp } = useAuth()
  const initialTab = searchParams.get("tab") as AuthMode
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>(
    initialTab === "seller" || initialTab === "register" || initialTab === "login"
      ? initialTab
      : "login"
  )
  const [showPassword, setShowPassword] = useState(false)

  // OTP state
  const [otpPhone, setOtpPhone] = useState("")
  const [otpPurpose, setOtpPurpose] = useState<string | undefined>(undefined)
  const [otpEmail, setOtpEmail] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startResendTimer = useCallback(() => {
    setResendTimer(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const switchToOtp = (phone: string, email: string, purpose?: string) => {
    setOtpPhone(phone)
    setOtpEmail(email)
    setOtpPurpose(purpose)
    setMode("otp")
    startResendTimer()
  }

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register state
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPassword, setRegPassword] = useState("")

  // Seller state
  const [sellerFirstName, setSellerFirstName] = useState("")
  const [sellerLastName, setSellerLastName] = useState("")
  const [sellerBusinessName, setSellerBusinessName] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [sellerPhone, setSellerPhone] = useState("")
  const [sellerPassword, setSellerPassword] = useState("")
  const [sellerAgreement, setSellerAgreement] = useState(false)
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  useEffect(() => {
    if (mode === "seller" && categories.length === 0) {
      api.get<BusinessCategory[]>("/admin/business-categories")
        .then(setCategories)
        .catch(() => {
          // If admin endpoint fails, use fallback categories
          setCategories([
            { id: "fallback-electronics", name: "Electronics", description: null },
            { id: "fallback-fashion", name: "Fashion & Apparel", description: null },
            { id: "fallback-home", name: "Home & Garden", description: null },
            { id: "fallback-beauty", name: "Health & Beauty", description: null },
            { id: "fallback-food", name: "Food & Beverages", description: null },
            { id: "fallback-general", name: "General Retail", description: null },
          ])
        })
    }
  }, [mode, categories.length])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(loginEmail, loginPassword)
      toast.add({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
        type: "success",
      })
      if (user.account_type === "seller" || user.is_seller) {
        router.push("/dashboard/seller")
      } else if (user.account_type === "admin" || user.account_type === "super_admin") {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard/user")
      }
    } catch (err) {
      const apiErr = err as ApiError
      const detail = apiErr?.detail || ""
      // If account is not verified, redirect to OTP verification
      if (detail.toLowerCase().includes("not verified") || detail.toLowerCase().includes("verification")) {
        toast.add({
          title: "Verification required",
          description: "Please verify your phone number to continue.",
          type: "warning",
        })
        // Try to find the user's phone by their email
        try {
          const res = await api.get<{ phone: string }>(`/users/lookup?email=${encodeURIComponent(loginEmail)}`)
          switchToOtp(res.phone, loginEmail, "register")
        } catch {
          // If lookup fails, ask user to enter phone manually
          switchToOtp("", loginEmail, "register")
        }
      } else {
        toast.add({
          title: "Sign in failed",
          description: getApiError(err),
          type: "error",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        first_name: regFirstName,
        last_name: regLastName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      })
      toast.add({
        title: "Account created!",
        description: "A verification code has been sent to your phone.",
        type: "success",
      })
      switchToOtp(regPhone, regEmail, "register")
    } catch (err) {
      toast.add({
        title: "Registration failed",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSellerRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCategoryIds.length === 0) {
      toast.add({
        title: "Select categories",
        description: "Please select at least one business category.",
        type: "error",
      })
      return
    }
    setLoading(true)
    try {
      await registerSeller({
        first_name: sellerFirstName,
        last_name: sellerLastName,
        email: sellerEmail,
        phone: sellerPhone,
        password: sellerPassword,
        business_name: sellerBusinessName,
        business_category_ids: selectedCategoryIds,
        agreement_accepted: true,
      })
      toast.add({
        title: "Seller account created!",
        description: "A verification code has been sent to your phone.",
        type: "success",
      })
      switchToOtp(sellerPhone, sellerEmail, "register_seller")
    } catch (err) {
      toast.add({
        title: "Seller registration failed",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <img
          src="/apple-touch-icon.png"
          alt="XerinMarket"
          className="size-14 rounded-2xl object-cover shadow-md"
        />
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login" && "Welcome back"}
          {mode === "register" && "Create your account"}
          {mode === "seller" && "Become a Seller"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" && "Sign in to continue to XerinMarket"}
          {mode === "register" && "Join XerinMarket and start shopping today"}
          {mode === "seller" && "Register your business and start selling"}
        </p>
      </div>

      {mode === "otp" ? (
        <OtpVerificationForm
          phone={otpPhone}
          email={otpEmail}
          purpose={otpPurpose}
          resendTimer={resendTimer}
          onResend={async () => {
            try {
              await sendOtp(otpPhone, otpPurpose)
              toast.add({ title: "Code sent", description: "A new verification code has been sent.", type: "info" })
              startResendTimer()
            } catch (err) {
              toast.add({ title: "Failed to resend", description: getApiError(err), type: "error" })
            }
          }}
          onVerify={async (code) => {
            setLoading(true)
            try {
              await verifyOtp(otpPhone, code, otpPurpose)
              toast.add({ title: "Phone verified!", description: "Your account has been verified. You can now sign in.", type: "success" })
              setMode("login")
              setLoginEmail(otpEmail)
            } catch (err) {
              toast.add({ title: "Verification failed", description: getApiError(err), type: "error" })
            } finally {
              setLoading(false)
            }
          }}
          loading={loading}
          onBack={() => setMode("login")}
          onPhoneChange={setOtpPhone}
        />
      ) : (
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as AuthMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Sign Up</TabsTrigger>
          <TabsTrigger value="seller">Seller</TabsTrigger>
        </TabsList>

        {/* LOGIN */}
        <TabsContent value="login">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="m@example.com"
                    className="pl-9"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox id="remember" defaultChecked />
                <FieldLabel htmlFor="remember" className="text-sm font-normal">
                  Remember me for 30 days
                </FieldLabel>
              </Field>
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <FieldSeparator>Or continue with</FieldSeparator>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" className="w-full">
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                      fill="currentColor"
                    />
                  </svg>
                  GitHub
                </Button>
              </div>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Sign up
                </button>
              </FieldDescription>
            </FieldGroup>
          </form>
        </TabsContent>

        {/* REGISTER */}
        <TabsContent value="register">
          <form className="flex flex-col gap-4" onSubmit={handleRegister}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="reg-first-name">First Name</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reg-first-name"
                      type="text"
                      placeholder="John"
                      className="pl-9"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="reg-last-name">Last Name</FieldLabel>
                  <Input
                    id="reg-last-name"
                    type="text"
                    placeholder="Doe"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="m@example.com"
                    className="pl-9"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-phone">Phone</FieldLabel>
                <PhoneInput
                  id="reg-phone"
                  value={regPhone}
                  onChange={setRegPhone}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    className="pl-9 pr-9"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldDescription>
                  At least 8 characters with 1 uppercase letter and 1 number.
                </FieldDescription>
              </Field>
              <Field orientation="horizontal" className="items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" required />
                <FieldLabel
                  htmlFor="terms"
                  className="text-sm font-normal leading-snug"
                >
                  I agree to the{" "}
                  <a href="/terms" className="underline underline-offset-4">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline underline-offset-4">
                    Privacy Policy
                  </a>
                </FieldLabel>
              </Field>
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Sign in
                </button>
              </FieldDescription>
            </FieldGroup>
          </form>
        </TabsContent>

        {/* SELLER REGISTER */}
        <TabsContent value="seller">
          <form className="flex flex-col gap-4" onSubmit={handleSellerRegister}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="seller-first-name">First Name</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="seller-first-name"
                      type="text"
                      placeholder="John"
                      className="pl-9"
                      value={sellerFirstName}
                      onChange={(e) => setSellerFirstName(e.target.value)}
                      required
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="seller-last-name">Last Name</FieldLabel>
                  <Input
                    id="seller-last-name"
                    type="text"
                    placeholder="Doe"
                    value={sellerLastName}
                    onChange={(e) => setSellerLastName(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="seller-name">Business Name</FieldLabel>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-name"
                    type="text"
                    placeholder="Acme Trading Co."
                    className="pl-9"
                    value={sellerBusinessName}
                    onChange={(e) => setSellerBusinessName(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-email">Business Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-email"
                    type="email"
                    placeholder="business@example.com"
                    className="pl-9"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-phone">Phone Number</FieldLabel>
                <PhoneInput
                  id="seller-phone"
                  value={sellerPhone}
                  onChange={setSellerPhone}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Business Categories</FieldLabel>
                <FieldDescription>Select at least one category for your business.</FieldDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Loading categories...</span>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selectedCategoryIds.includes(cat.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-muted"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    className="pl-9 pr-9"
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldDescription>
                  At least 8 characters with 1 uppercase letter and 1 number.
                </FieldDescription>
              </Field>
              <Field orientation="horizontal" className="items-start gap-2">
                <Checkbox
                  id="seller-terms"
                  className="mt-0.5"
                  checked={sellerAgreement}
                  onCheckedChange={(val) => setSellerAgreement(!!val)}
                  required
                />
                <FieldLabel
                  htmlFor="seller-terms"
                  className="text-sm font-normal leading-snug"
                >
                  I agree to the{" "}
                  <a
                    href="/seller-terms"
                    className="underline underline-offset-4"
                  >
                    Seller Agreement
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline underline-offset-4">
                    Privacy Policy
                  </a>
                </FieldLabel>
              </Field>
              <Button type="submit" className="w-full" loading={loading} disabled={!sellerAgreement}>
                {loading ? "Registering..." : "Register as Seller"}
              </Button>
              <FieldDescription className="text-center">
                Already a seller?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Sign in
                </button>
              </FieldDescription>
            </FieldGroup>
          </form>
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}

function OtpVerificationForm({
  phone,
  email,
  purpose,
  resendTimer,
  loading,
  onResend,
  onVerify,
  onBack,
  onPhoneChange,
}: {
  phone: string
  email: string
  purpose?: string
  resendTimer: number
  loading: boolean
  onResend: () => void
  onVerify: (code: string) => void
  onBack: () => void
  onPhoneChange: (phone: string) => void
}) {
  const [otp, setOtp] = useState("")
  const [localPhone, setLocalPhone] = useState(phone)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) return
    onVerify(otp)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="size-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Your Phone</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification code to your phone number. Enter it below to activate your account.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FieldGroup>
          {!phone && (
            <Field>
              <FieldLabel htmlFor="otp-phone">Phone Number</FieldLabel>
              <PhoneInput
                id="otp-phone"
                value={localPhone}
                onChange={(val) => {
                  setLocalPhone(val)
                  onPhoneChange(val)
                }}
                required
              />
              <FieldDescription>Enter the phone number you registered with.</FieldDescription>
            </Field>
          )}

          {phone && (
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Code sent to</p>
              <p className="text-base font-semibold">{phone}</p>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="otp-code">Verification Code</FieldLabel>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 6-digit code"
              className="text-center text-lg font-bold tracking-[0.3em]"
              maxLength={10}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
            <FieldDescription>Enter the 6-digit code sent to your phone.</FieldDescription>
          </Field>

          <Button type="submit" className="w-full" loading={loading} disabled={otp.length < 4}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to login
            </button>
            {resendTimer > 0 ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={onResend}
                className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Resend code
              </button>
            )}
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}

export function AuthForm(props: React.ComponentProps<"div">) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner {...props} />
    </Suspense>
  )
}
