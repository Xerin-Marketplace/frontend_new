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
import { Mail, Lock, User, Store, Eye, EyeOff, ShieldCheck, ArrowLeft, Phone, CheckCircle2 } from "lucide-react"
import { PhoneInput } from "@/components/ui/phone-input"
import { useAuth, type ApiError } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { PasswordStrength } from "@/components/password-strength"

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

function getFieldError(errors: Record<string, string[]> | undefined, field: string): string | undefined {
  if (!errors || !errors[field]) return undefined
  return Array.isArray(errors[field]) ? errors[field][0] : errors[field]
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

  // Show toast if redirected due to session expiry
  useEffect(() => {
    const reason = searchParams.get("reason")
    if (reason === "session_expired") {
      toast.add({
        title: "Session expired",
        description: "Your session has expired. Please sign in again to continue.",
        type: "warning",
      })
      // Clean the URL param so it doesn't show again on refresh
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("reason")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  // OTP state
  const [otpPhone, setOtpPhone] = useState("")
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

  const switchToOtp = (phone: string, email: string) => {
    setOtpPhone(phone)
    setOtpEmail(email)
    setMode("otp")
    startResendTimer()
  }

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})

  // Register state
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regAgreed, setRegAgreed] = useState(false)
  const [regErrors, setRegErrors] = useState<Record<string, string>>({})

  // Seller state
  const [sellerFirstName, setSellerFirstName] = useState("")
  const [sellerLastName, setSellerLastName] = useState("")
  const [sellerBusinessName, setSellerBusinessName] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [sellerPhone, setSellerPhone] = useState("")
  const [sellerPassword, setSellerPassword] = useState("")
  const [sellerAgreement, setSellerAgreement] = useState(false)
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categoryError, setCategoryError] = useState(false)
  const [sellerErrors, setSellerErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === "seller" && !categoriesLoading && categories.length === 0 && !categoryError) {
      api.get<BusinessCategory[]>("/admin/business-categories")
        .then((data) => {
          setCategories(data)
          setCategoryError(false)
        })
        .catch(() => {
          setCategories([])
          setCategoryError(true)
        })
        .finally(() => setCategoriesLoading(false))
    }
  }, [mode, categories.length, categoriesLoading, categoryError])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  // Clear errors when switching tabs
  const handleTabChange = (v: string) => {
    setMode(v as AuthMode)
    setLoginErrors({})
    setRegErrors({})
    setSellerErrors({})
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginErrors({})
    if (!loginEmail || !loginPassword) {
      setLoginErrors({
        ...(!loginEmail && { email: "Email is required" }),
        ...(!loginPassword && { password: "Password is required" }),
      })
      return
    }
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
      if (detail.toLowerCase().includes("not verified") || detail.toLowerCase().includes("verification")) {
        toast.add({
          title: "Verification required",
          description: "Please verify your phone number to continue.",
          type: "warning",
        })
        try {
          const res = await api.get<{ phone: string }>(`/users/lookup?email=${encodeURIComponent(loginEmail)}`)
          switchToOtp(res.phone, loginEmail)
        } catch {
          switchToOtp("", loginEmail)
        }
      } else {
        if (apiErr?.errors) {
          const fieldErrs: Record<string, string> = {}
          for (const [key, val] of Object.entries(apiErr.errors)) {
            fieldErrs[key] = Array.isArray(val) ? val[0] : val
          }
          setLoginErrors(fieldErrs)
        }
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
    setRegErrors({})
    if (!regAgreed) {
      toast.add({ title: "Please accept the Terms", description: "You must agree to the Terms of Service and Privacy Policy.", type: "warning" })
      return
    }
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
      switchToOtp(regPhone, regEmail)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr?.errors) {
        const fieldErrs: Record<string, string> = {}
        for (const [key, val] of Object.entries(apiErr.errors)) {
          fieldErrs[key] = Array.isArray(val) ? val[0] : val
        }
        setRegErrors(fieldErrs)
      }
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
    setSellerErrors({})

    // Client-side validation
    const errs: Record<string, string> = {}
    if (!sellerFirstName.trim()) errs.first_name = "First name is required"
    if (!sellerLastName.trim()) errs.last_name = "Last name is required"
    if (!sellerBusinessName.trim()) errs.business_name = "Business name is required"
    if (!sellerEmail.trim()) {
      errs.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail.trim())) {
      errs.email = "Please enter a valid email address"
    }
    if (!sellerPhone.trim()) {
      errs.phone = "Phone number is required"
    } else if (sellerPhone.trim().length < 8) {
      errs.phone = "Please enter a valid phone number"
    }
    if (!sellerPassword) {
      errs.password = "Password is required"
    } else if (sellerPassword.length < 10) {
      errs.password = "Password must be at least 10 characters"
    }
    if (selectedCategoryIds.length === 0) {
      errs.business_category_ids = "Please select at least one business category"
    }

    if (Object.keys(errs).length > 0) {
      setSellerErrors(errs)
      toast.add({
        title: "Please fix the errors",
        description: "Some fields need your attention before submitting.",
        type: "warning",
      })
      return
    }

    if (!sellerAgreement) {
      toast.add({ title: "Please accept the Seller Agreement", type: "warning" })
      return
    }

    setLoading(true)
    try {
      await registerSeller({
        first_name: sellerFirstName.trim(),
        last_name: sellerLastName.trim(),
        email: sellerEmail.trim().toLowerCase(),
        phone: sellerPhone.trim(),
        password: sellerPassword,
        business_name: sellerBusinessName.trim(),
        business_category_ids: selectedCategoryIds,
        agreement_accepted: true,
      })
      toast.add({
        title: "Seller account created!",
        description: "A verification code has been sent to your phone.",
        type: "success",
      })
      switchToOtp(sellerPhone, sellerEmail)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr?.errors) {
        const fieldErrs: Record<string, string> = {}
        for (const [key, val] of Object.entries(apiErr.errors)) {
          fieldErrs[key] = Array.isArray(val) ? val[0] : val
        }
        setSellerErrors(fieldErrs)
      }

      // Specific error messages based on status code
      const status = apiErr?.status ?? 0
      let title = "Seller registration failed"
      let description = getApiError(err)

      if (status === 500) {
        title = "Server error"
        description = "Our servers are having issues. Please try again in a moment."
      } else if (status === 0) {
        title = "Connection error"
        description = "Cannot reach the server. Please check your internet and try again."
      } else if (status === 400) {
        const detail = apiErr?.detail || ""
        if (detail.includes("already exists")) {
          title = "Account exists"
          description = "An account with this email or phone already exists. Try signing in instead."
        }
      } else if (status === 429) {
        title = "Too many attempts"
        description = "Please wait a moment before trying again."
      }

      toast.add({ title, description, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const fieldErrorClass = (error?: string) => error ? "border-red-500 focus-visible:ring-red-500" : ""

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
          resendTimer={resendTimer}
          onResend={async () => {
            try {
              await sendOtp(otpPhone)
              toast.add({ title: "Code sent", description: "A new verification code has been sent.", type: "info" })
              startResendTimer()
            } catch (err) {
              toast.add({ title: "Failed to resend", description: getApiError(err), type: "error" })
            }
          }}
          onVerify={async (code) => {
            setLoading(true)
            try {
              await verifyOtp(otpPhone, code)
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
        onValueChange={handleTabChange}
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
                    placeholder="barua-pepe@mfano.tz"
                    className={cn("pl-9", fieldErrorClass(loginErrors.email))}
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value)
                      if (loginErrors.email) setLoginErrors((p) => ({ ...p, email: "" }))
                    }}
                    required
                  />
                </div>
                {loginErrors.email && <FieldDescription className="text-red-500">{loginErrors.email}</FieldDescription>}
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
                    placeholder="Neno la siri (Tumia herufi na namba)"
                    className={cn("pl-9 pr-9", fieldErrorClass(loginErrors.password))}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: "" }))
                    }}
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
                {loginErrors.password && <FieldDescription className="text-red-500">{loginErrors.password}</FieldDescription>}
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
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleTabChange("register")}
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
                      placeholder="Juma"
                      className={cn("pl-9", fieldErrorClass(regErrors.first_name))}
                      value={regFirstName}
                      onChange={(e) => {
                        setRegFirstName(e.target.value)
                        if (regErrors.first_name) setRegErrors((p) => ({ ...p, first_name: "" }))
                      }}
                      required
                    />
                  </div>
                  {regErrors.first_name && <FieldDescription className="text-red-500">{regErrors.first_name}</FieldDescription>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="reg-last-name">Last Name</FieldLabel>
                  <Input
                    id="reg-last-name"
                    type="text"
                    placeholder="Mussa"
                    className={cn(fieldErrorClass(regErrors.last_name))}
                    value={regLastName}
                    onChange={(e) => {
                      setRegLastName(e.target.value)
                      if (regErrors.last_name) setRegErrors((p) => ({ ...p, last_name: "" }))
                    }}
                    required
                  />
                  {regErrors.last_name && <FieldDescription className="text-red-500">{regErrors.last_name}</FieldDescription>}
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="barua-pepe@mfano.tz"
                    className={cn("pl-9", fieldErrorClass(regErrors.email))}
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value)
                      if (regErrors.email) setRegErrors((p) => ({ ...p, email: "" }))
                    }}
                    required
                  />
                </div>
                {regErrors.email && <FieldDescription className="text-red-500">{regErrors.email}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-phone">Phone</FieldLabel>
                <PhoneInput
                  id="reg-phone"
                  value={regPhone}
                  onChange={setRegPhone}
                  required
                />
                {regErrors.phone && <FieldDescription className="text-red-500">{regErrors.phone}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Weka neno la siri imara"
                    className={cn("pl-9 pr-9", fieldErrorClass(regErrors.password))}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value)
                      if (regErrors.password) setRegErrors((p) => ({ ...p, password: "" }))
                    }}
                    required
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordStrength password={regPassword} className="mt-2" />
                {regErrors.password && <FieldDescription className="text-red-500">{regErrors.password}</FieldDescription>}
              </Field>
              <Field orientation="horizontal" className="items-start gap-2">
                <Checkbox
                  id="terms"
                  className="mt-0.5"
                  checked={regAgreed}
                  onCheckedChange={(val) => setRegAgreed(!!val)}
                />
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
              <Button type="submit" className="w-full" loading={loading} disabled={!regAgreed}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleTabChange("login")}
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
                      placeholder="Juma"
                      className={cn("pl-9", fieldErrorClass(sellerErrors.first_name))}
                      value={sellerFirstName}
                      onChange={(e) => {
                        setSellerFirstName(e.target.value)
                        if (sellerErrors.first_name) setSellerErrors((p) => ({ ...p, first_name: "" }))
                      }}
                      required
                    />
                  </div>
                  {sellerErrors.first_name && <FieldDescription className="text-red-500">{sellerErrors.first_name}</FieldDescription>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="seller-last-name">Last Name</FieldLabel>
                  <Input
                    id="seller-last-name"
                    type="text"
                    placeholder="Mussa"
                    className={cn(fieldErrorClass(sellerErrors.last_name))}
                    value={sellerLastName}
                    onChange={(e) => {
                      setSellerLastName(e.target.value)
                      if (sellerErrors.last_name) setSellerErrors((p) => ({ ...p, last_name: "" }))
                    }}
                    required
                  />
                  {sellerErrors.last_name && <FieldDescription className="text-red-500">{sellerErrors.last_name}</FieldDescription>}
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="seller-name">Business Name</FieldLabel>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-name"
                    type="text"
                    placeholder="e.g. Duka la Xerin"
                    className={cn("pl-9", fieldErrorClass(sellerErrors.business_name))}
                    value={sellerBusinessName}
                    onChange={(e) => {
                      setSellerBusinessName(e.target.value)
                      if (sellerErrors.business_name) setSellerErrors((p) => ({ ...p, business_name: "" }))
                    }}
                    required
                  />
                </div>
                {sellerErrors.business_name && <FieldDescription className="text-red-500">{sellerErrors.business_name}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-email">Business Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-email"
                    type="email"
                    placeholder="biashara@mfano.tz"
                    className={cn("pl-9", fieldErrorClass(sellerErrors.email))}
                    value={sellerEmail}
                    onChange={(e) => {
                      setSellerEmail(e.target.value)
                      if (sellerErrors.email) setSellerErrors((p) => ({ ...p, email: "" }))
                    }}
                    required
                  />
                </div>
                {sellerErrors.email && <FieldDescription className="text-red-500">{sellerErrors.email}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-phone">Phone Number</FieldLabel>
                <PhoneInput
                  id="seller-phone"
                  value={sellerPhone}
                  onChange={setSellerPhone}
                  required
                />
                {sellerErrors.phone && <FieldDescription className="text-red-500">{sellerErrors.phone}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel>Business Categories</FieldLabel>
                <FieldDescription>Select at least one category for your business.</FieldDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categoriesLoading ? (
                    <span className="text-sm text-muted-foreground">Loading categories...</span>
                  ) : categoryError ? (
                    <span className="text-sm text-red-500">Failed to load categories. Please refresh the page.</span>
                  ) : categories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No business categories are available yet.</span>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selectedCategoryIds.includes(cat.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-muted"
                        )}
                      >
                        {selectedCategoryIds.includes(cat.id) && <CheckCircle2 className="size-3" />}
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
                {sellerErrors.business_category_ids && <FieldDescription className="text-red-500">{sellerErrors.business_category_ids}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Weka neno la siri imara"
                    className={cn("pl-9 pr-9", fieldErrorClass(sellerErrors.password))}
                    value={sellerPassword}
                    onChange={(e) => {
                      setSellerPassword(e.target.value)
                      if (sellerErrors.password) setSellerErrors((p) => ({ ...p, password: "" }))
                    }}
                    required
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordStrength password={sellerPassword} className="mt-2" />
                {sellerErrors.password && <FieldDescription className="text-red-500">{sellerErrors.password}</FieldDescription>}
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
                    href="/terms/seller"
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
                  onClick={() => handleTabChange("login")}
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
  resendTimer,
  loading,
  onResend,
  onVerify,
  onBack,
  onPhoneChange,
}: {
  phone: string
  email: string
  resendTimer: number
  loading: boolean
  onResend: () => void
  onVerify: (code: string) => void
  onBack: () => void
  onPhoneChange: (phone: string) => void
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [localPhone, setLocalPhone] = useState(phone)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [])

  const code = digits.join("")

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    if (!cleanValue) {
      setDigits((prev) => {
        const next = [...prev]
        next[index] = ""
        return next
      })
      return
    }

    // Handle paste of multiple digits
    if (cleanValue.length > 1) {
      const pasted = cleanValue.slice(0, 6 - index).split("")
      setDigits((prev) => {
        const next = [...prev]
        pasted.forEach((d, i) => {
          if (index + i < 6) next[index + i] = d
        })
        return next
      })
      const lastFilled = Math.min(index + pasted.length, 5)
      inputRefs.current[lastFilled]?.focus()
      return
    }

    setDigits((prev) => {
      const next = [...prev]
      next[index] = cleanValue
      return next
    })

    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4) return
    onVerify(code)
  }

  const isComplete = code.length === 6

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
            <FieldLabel htmlFor="otp-code-0">Verification Code</FieldLabel>
            <div className="flex justify-between gap-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el }}
                  id={`otp-code-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={cn(
                    "size-11 rounded-lg border bg-background text-center text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring sm:size-12",
                    digit ? "border-primary" : "border-input",
                    isComplete && "border-green-500"
                  )}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            <FieldDescription>Ingiza namba 6 ulizotumiwa kwenye simu yako.</FieldDescription>
          </Field>

          <Button type="submit" className="w-full" loading={loading} disabled={code.length < 4}>
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
              <span className="text-sm text-muted-foreground">
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
