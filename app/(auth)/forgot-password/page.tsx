"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Mail, Lock, ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { useAuth, type ApiError } from "@/lib/auth-context"
import { PasswordStrength } from "@/components/password-strength"

function getApiError(err: unknown): string {
  const e = err as ApiError
  return e?.detail || "Something went wrong. Please try again."
}

type Step = "email" | "otp" | "reset" | "done"

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth()
  const [step, setStep] = useState<Step>("email")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      toast.add({
        title: "Reset code sent",
        description: "A password reset code has been sent to your email and phone.",
        type: "success",
      })
      setStep("otp")
      startResendTimer()
    } catch (err) {
      toast.add({
        title: "Failed to send code",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) return
    setLoading(true)
    try {
      // We don't verify the OTP separately - we use it in the reset-password call
      // Just move to the reset step
      setStep("reset")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.add({ title: "Passwords don't match", type: "error" })
      return
    }
    if (newPassword.length < 10) {
      toast.add({ title: "Password too short", description: "At least 10 characters required.", type: "error" })
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, otp, newPassword)
      toast.add({
        title: "Password reset!",
        description: "Your password has been reset. You can now sign in.",
        type: "success",
      })
      setStep("done")
    } catch (err) {
      toast.add({
        title: "Reset failed",
        description: getApiError(err),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <img
            src="/apple-touch-icon.png"
            alt="XerinMarket"
            className="size-12 rounded-xl object-cover shadow-md"
          />
          <span className="text-lg font-semibold tracking-tight">XerinMarket</span>
        </div>

        {step === "email" && (
          <>
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Lock className="size-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a verification code to reset your password.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </Field>
                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? "Sending..." : "Send Reset Code"}
                </Button>
              </FieldGroup>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth?tab=login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </Link>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="size-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Enter Verification Code</h1>
              <p className="text-sm text-muted-foreground">
                We sent a code to your email and phone associated with <strong>{email}</strong>.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
              <FieldGroup>
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
                  <FieldDescription>Enter the code sent to your phone and email.</FieldDescription>
                </Field>
                <Button type="submit" className="w-full" loading={loading} disabled={otp.length < 4}>
                  Continue
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                  {resendTimer > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await forgotPassword(email)
                          toast.add({ title: "Code resent", type: "info" })
                          startResendTimer()
                        } catch (err) {
                          toast.add({ title: "Failed to resend", description: getApiError(err), type: "error" })
                        }
                      }}
                      className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </FieldGroup>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <Lock className="size-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
              <p className="text-sm text-muted-foreground">
                Enter a new password for your account.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      className="pl-9 pr-9"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} className="mt-2" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <FieldDescription className="text-red-500">Passwords do not match</FieldDescription>
                  )}
                </Field>
                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </FieldGroup>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative flex size-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                <ShieldCheck className="size-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Password Reset!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
            </div>
            <Link
              href="/auth?tab=login"
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
