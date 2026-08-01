"use client"

import { useState, Suspense } from "react"
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
import { Mail, Lock, User, Phone, Store, Eye, EyeOff } from "lucide-react"

type AuthMode = "login" | "register" | "seller"

function AuthFormInner({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") as AuthMode
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>(
    initialTab === "seller" || initialTab === "register" || initialTab === "login"
      ? initialTab
      : "login"
  )
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (mode === "login") {
        toast.add({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
          type: "success",
        })
        router.push("/dashboard/user")
      } else if (mode === "register") {
        toast.add({
          title: "Account created!",
          description: "Welcome to XerinMarket. Check your email to verify your account.",
          type: "success",
        })
        router.push("/dashboard/user")
      } else if (mode === "seller") {
        toast.add({
          title: "Welcome to Seller Center!",
          description: "Your seller account is ready. Let's start selling.",
          type: "success",
        })
        router.push("/dashboard/seller")
      }
    }, 2000)
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
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reg-name">Full Name</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="m@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-phone">Phone</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+255 7XX XXX XXX"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
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
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="seller-name">Business Name</FieldLabel>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-name"
                    type="text"
                    placeholder="Acme Trading Co."
                    className="pl-9"
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
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-phone">Phone Number</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-phone"
                    type="tel"
                    placeholder="+255 7XX XXX XXX"
                    className="pl-9"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="seller-password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seller-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
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
              <Field orientation="horizontal" className="items-start gap-2">
                <Checkbox id="seller-terms" className="mt-0.5" required />
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
              <Button type="submit" className="w-full" loading={loading}>
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
