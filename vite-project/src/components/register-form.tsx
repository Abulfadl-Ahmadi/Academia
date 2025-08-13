import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

type RegistrationStep = 'form' | 'verification' | 'complete'

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<RegistrationStep>('form')
  const [formData, setFormData] = useState({
    user: {
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
    },
    national_id: "",
    phone_number: "",
    birth_date: "",
    grade: "",
  })
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('user.')) {
      const userField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [userField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axios.post(
        "http://localhost:8000/api/send-verification/",
        {
          email: formData.user.email,
          username: formData.user.username,
          first_name: formData.user.first_name,
          last_name: formData.user.last_name,
        },
        { withCredentials: true }
      )

      console.log("Verification code sent:", response.data)
      setEmail(formData.user.email)
      setStep('verification')
    } catch (err: any) {
      console.error("Send verification error:", err)
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(errorData)
        }
      } else {
        setError("خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axios.post(
        "http://localhost:8000/api/verify-email/",
        {
          email: email,
          code: verificationCode,
        },
        { withCredentials: true }
      )

      console.log("Email verified:", response.data)
      setStep('complete')
    } catch (err: any) {
      console.error("Verify email error:", err)
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(errorData)
        }
      } else {
        setError("خطا در تایید کد. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axios.post(
        "http://localhost:8000/api/complete-registration/",
        {
          email: email,
          username: formData.user.username,
          password: formData.user.password,
          first_name: formData.user.first_name,
          last_name: formData.user.last_name,
          national_id: formData.national_id,
          phone_number: formData.phone_number,
          birth_date: formData.birth_date,
          grade: formData.grade,
        },
        { withCredentials: true }
      )

      console.log("Registration completed:", response.data)
      navigate("/login")
    } catch (err: any) {
      console.error("Complete registration error:", err)
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(errorData)
        }
      } else {
        setError("خطا در تکمیل ثبت‌نام. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const renderFormStep = () => (
    <form onSubmit={handleSendVerification}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">عضو شوید!</h1>
          <p className="text-muted-foreground text-balance">
            سفر یادگیری شما از اینجا شروع می‌شود.
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <div className="grid gap-4">
          {/* User Information */}
          <div className="grid gap-3">
            <Label htmlFor="username">نام‌کاربری *</Label>
            <Input
              id="username"
              type="text"
              value={formData.user.username}
              onChange={(e) => handleInputChange('user.username', e.target.value)}
              placeholder="نام کاربری خود را وارد کنید"
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email">ایمیل *</Label>
            <Input
              id="email"
              type="email"
              value={formData.user.email}
              onChange={(e) => handleInputChange('user.email', e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="password">گذرواژه *</Label>
            <Input
              id="password"
              type="password"
              value={formData.user.password}
              onChange={(e) => handleInputChange('user.password', e.target.value)}
              placeholder="حداقل 6 کاراکتر"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">نام</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.user.first_name}
                onChange={(e) => handleInputChange('user.first_name', e.target.value)}
                placeholder="نام"
              />
            </div>
            <div>
              <Label htmlFor="last_name">نام خانوادگی</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.user.last_name}
                onChange={(e) => handleInputChange('user.last_name', e.target.value)}
                placeholder="نام خانوادگی"
              />
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid gap-3">
            <Label htmlFor="national_id">کد ملی</Label>
            <Input
              id="national_id"
              type="text"
              value={formData.national_id}
              onChange={(e) => handleInputChange('national_id', e.target.value)}
              placeholder="1234567890"
              maxLength={10}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="phone_number">شماره تلفن</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              placeholder="09123456789"
              maxLength={11}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="birth_date">تاریخ تولد</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="grade">پایه تحصیلی</Label>
            <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="پایه تحصیلی خود را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">دهم</SelectItem>
                <SelectItem value="11">یازدهم</SelectItem>
                <SelectItem value="12">دوازدهم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "در حال ارسال کد تایید..." : "ارسال کد تایید"}
          </Button>

          <div className="text-center text-sm">
            حساب دارید؟ {" "}
            <a href="/login" className="underline underline-offset-4">
               ورود
            </a>
          </div>
        </div>
      </div>
    </form>
  )

  const renderVerificationStep = () => (
    <form onSubmit={handleVerifyEmail}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">تایید ایمیل</h1>
          <p className="text-muted-foreground text-balance">
            کد تایید به ایمیل {email} ارسال شد
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
            onClick={() => setStep('form')}
          >
            بازگشت
          </Button>
        </div>
      </div>
    </form>
  )

  const renderCompleteStep = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold">تکمیل ثبت‌نام</h1>
        <p className="text-muted-foreground text-balance">
          ایمیل شما با موفقیت تایید شد. حالا می‌توانید ثبت‌نام خود را تکمیل کنید.
        </p>
      </div>

      {error && (
        <p className="text-red-500 text-center text-sm">{error}</p>
      )}

      <div className="grid gap-4">
        <Button 
          onClick={handleCompleteRegistration} 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "در حال تکمیل ثبت‌نام..." : "تکمیل ثبت‌نام"}
        </Button>

        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={() => setStep('verification')}
        >
          بازگشت
        </Button>
      </div>
    </div>
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            {step === 'form' && renderFormStep()}
            {step === 'verification' && renderVerificationStep()}
            {step === 'complete' && renderCompleteStep()}
          </div>
          <div className="bg-muted relative hidden md:block">
            <img
              src="http://localhost:8000/media/login.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        با کلید روی «ساخت حساب» شما با 
        <a href="#"> شرایط خدمات </a>
        و 
        <a href="#"> سیاست حفظ حریم خصوصی </a>
        ما موافقت می‌کنید.
      </div>
    </div>
  )
}
