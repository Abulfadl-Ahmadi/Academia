import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import axiosInstance from "@/lib/axios"
import { useNavigate } from "react-router-dom"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [step, setStep] = useState<'phone' | 'verify' | 'reset'>('phone')
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post(
        "/send-reset-password/",
        {
          phone_number: phoneNumber,
        }
      )
      console.log("Reset code sent:", response.data)
      setStep('verify')
    } catch (err: unknown) {
      console.error("Send reset code error:", err)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: Record<string, unknown> } }
        const errorData = axiosError.response?.data
        if (errorData && typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(String(errorData))
        }
      } else {
        setError("خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post(
        "/verify-reset-password/",
        {
          phone_number: phoneNumber,
          code: verificationCode,
        }
      )
      console.log("Code verified:", response.data)
      setStep('reset')
    } catch (err: unknown) {
      console.error("Verify code error:", err)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: Record<string, unknown> } }
        const errorData = axiosError.response?.data
        if (errorData && typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(String(errorData))
        }
      } else {
        setError("خطا در تایید کد. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== newPasswordConfirm) {
      setError("گذرواژه‌ها با هم مطابقت ندارند")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post(
        "/reset-password/",
        {
          phone_number: phoneNumber,
          code: verificationCode,
          new_password: newPassword,
          new_password_confirm: newPasswordConfirm,
        }
      )
      console.log("Password reset:", response.data)
      // Redirect to login with success message
      navigate("/login", {
        state: {
          message: "رمز عبور با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید.",
          phone_number: phoneNumber
        }
      })
    } catch (err: unknown) {
      console.error("Reset password error:", err)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: Record<string, unknown> } }
        const errorData = axiosError.response?.data
        if (errorData && typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(String(errorData))
        }
      } else {
        setError("خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const renderPhoneStep = () => (
    <form onSubmit={handleSendResetCode}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">بازیابی رمز عبور</h1>
          <p className="text-muted-foreground text-balance">
            شماره موبایل خود را وارد کنید تا کد تایید دریافت کنید.
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="phoneNumber">شماره موبایل *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09123456789"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "در حال ارسال..." : "ارسال کد تایید"}
          </Button>

          <div className="text-center text-sm">
            به یاد آوردید؟ {" "}
            <a href="/login" className="underline underline-offset-4">
              بازگشت به ورود
            </a>
          </div>
        </div>
      </div>
    </form>
  )

  const renderVerifyStep = () => (
    <form onSubmit={handleVerifyCode}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">تایید کد</h1>
          <p className="text-muted-foreground text-balance">
            کد تایید ارسال شده به شماره {phoneNumber} را وارد کنید
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <div className="grid gap-4">
          <div className="grid gap-3 items-center">
            <Label>کد تایید *</Label>
            <div className="flex test-left flex-row-reverse w-full justify-center" >
              <InputOTP
                className="flex test-left flex-row-reverse"
                maxLength={6}
                value={verificationCode}
                onChange={(val) => setVerificationCode(val)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={0} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || verificationCode.length !== 6}>
            {loading ? "در حال تایید..." : "تایید کد"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setStep('phone')}
          >
            بازگشت
          </Button>
        </div>
      </div>
    </form>
  )

  const renderResetStep = () => (
    <form onSubmit={handleResetPassword}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">تنظیم رمز عبور جدید</h1>
          <p className="text-muted-foreground text-balance">
            رمز عبور جدید خود را وارد کنید
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="newPassword">رمز عبور جدید *</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="حداقل 6 کاراکتر"
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="newPasswordConfirm">تکرار رمز عبور جدید *</Label>
            <Input
              id="newPasswordConfirm"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="رمز عبور را تکرار کنید"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "در حال تغییر..." : "تغییر رمز عبور"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setStep('verify')}
          >
            بازگشت
          </Button>
        </div>
      </div>
    </form>
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 w-full md:max-w-md mx-auto">
        <CardContent className="grid p-0">
          <div className="p-6 md:p-8">
            {step === 'phone' && renderPhoneStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'reset' && renderResetStep()}
          </div>
          {/* <div className="bg-muted relative hidden md:block">
            <img
              src="https://c242950.parspack.net/c242950/media/login.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.6]"
            />
          </div> */}
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        با کلید روی «ارسال کد تایید» شما با
        <a href="#"> شرایط خدمات </a>
        و
        <a href="#"> سیاست حفظ حریم خصوصی </a>
        ما موافقت می‌کنید.
      </div>
    </div>
  )
}