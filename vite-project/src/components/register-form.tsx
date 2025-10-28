// register-form.tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
// import { DatePicker } from "@/components/ui/date-picker"

import { useState } from "react"
import axios, { AxiosError } from "axios"
import { useNavigate } from "react-router-dom"

const baseURL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RegistrationStep = 'form' | 'verification' | 'complete'

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<RegistrationStep>('form')
  const [formData, setFormData] = useState({
    password: "",
    passwordConfirm: "",
    firstName: "",
    lastName: "",
    email: "", // Optional email
  })
  // const [birthDate, setBirthDate] = useState<Date | undefined>(undefined)
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const navigate = useNavigate()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // const handleSendVerification = async (email: string) => {
    
  //   setError("")
  //   setLoading(true)

  //   try {
  //     const response = await axios.post(
  //       baseURL + "/send-verification/",
  //       {
  //         email: email,
  //         // username: formData.user.username,
  //         // first_name: formData.user.first_name,
  //         // last_name: formData.user.last_name,
  //       }
  //       // { withCredentials: true }
  //     )

  //     console.log("Verification code sent:", response.data)
  //     setEmail(formData.user.email)
  //     setStep('verification')
  //   } catch (err: unknown) {
  //     console.error("Send verification error:", err)
  //     if (err && typeof err === 'object' && 'response' in err) {
  //       const axiosError = err as { response?: { data?: Record<string, unknown> } }
  //       const errorData = axiosError.response?.data
  //       if (errorData && typeof errorData === 'object') {
  //         const errorMessages = Object.values(errorData).flat()
  //         setError(errorMessages.join(', '))
  //       } else {
  //         setError(String(errorData))
  //       }
  //     } else {
  //       setError("خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.")
  //     }
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post(
        "/verify-phone/",
        {
          phone_number: phoneNumber,
          code: verificationCode,
        }
        // { withCredentials: true }
      )

      console.log("Phone verified:", response.data)
      setStep('complete')
    } catch (err: unknown) {
      console.error("Verify phone error:", err)
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

  const handleCompleteRegistration = async () => {
    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post(
        "/complete-registration/",
        {
          phone_number: phoneNumber,
          username: phoneNumber, // Use phone number as username
          password: formData.password,
          password_confirm: formData.passwordConfirm,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || undefined, // Optional email
        }
        // { withCredentials: true }
      )
      console.log("Registration completed:", response.data)
      
      // Check if there's pending cart for purchase
      const pendingCart = localStorage.getItem('pending_purchase_cart')
      console.log('Registration success - pendingCart:', pendingCart, 'response.data:', response.data)
      
      if (pendingCart || response.data.has_pending_cart || response.data.redirect_to_panel) {
        console.log('Redirecting to dashboard with cart')
        // Redirect to dashboard to complete purchase
  navigate("/panel?registration_success=true&show_cart=true");
      } else {
        // Normal registration flow
        navigate("/login", { 
          state: { 
            message: response.data.message || 'ثبت نام با موفقیت انجام شد. اکنون وارد شوید.',
            phone_number: phoneNumber 
          } 
        });
      }
    } catch (err: unknown) {
      console.error("Complete registration error:", err)
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
        setError("خطا در تکمیل ثبت‌نام. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  const validatePhoneNumber = (phone: string) => {
    // Iranian mobile number validation (starts with 09 and 10 digits total)
    const phoneRegex = /^09\d{9}$/
    return phoneRegex.test(phone)
  }

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError("شماره موبایل باید با 09 شروع شود و 11 رقم باشد")
      return
    }
    
    if (formData.password.length < 6) {
      setError("گذرواژه باید حداقل 6 کاراکتر باشد")
      return
    }
    
    if (formData.password !== formData.passwordConfirm) {
      setError("گذرواژه‌ها با هم مطابقت ندارند")
      return
    }
    
    setError("")
    setLoading(true)

    try {
      // First send verification code to phone
      const response = await axiosInstance.post(
        "/send-phone-verification/",
        {
          phone_number: phoneNumber,
        }
        // { withCredentials: true }
      )
      console.log("Verification code sent:", response.data)
      setStep('verification')
    } catch (err: unknown) {
      console.error("Send verification error:", err)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: Record<string, unknown> } }
        const status = axiosError.response?.status
        const errorData = axiosError.response?.data
        
        if (status === 400 && errorData?.error === "این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.") {
          // User already registered, show message
          setError("این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.")
          return;
        }
        
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

  const handleResendVerification = async () => {
    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post('/send-phone-verification/', { 
        phone_number: phoneNumber 
      })
      
      if (response.status === 200) {
        setStep('verification')
        setError("")
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<unknown>
        const errorData = axiosError.response?.data
        if (errorData && typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat()
          setError(errorMessages.join(', '))
        } else {
          setError(String(errorData) || "خطا در ارسال کد تایید")
        }
      } else {
        setError("خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.")
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

          <div className="grid gap-3">
            <Label htmlFor="password">گذرواژه *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="حداقل 6 کاراکتر"
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="passwordConfirm">تکرار گذرواژه *</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
              placeholder="گذرواژه را تکرار کنید"
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="firstName">نام</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="نام"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="lastName">نام خانوادگی</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="نام خانوادگی"
            />
          </div>

            {/* <div className="grid gap-3">
              <Label htmlFor="email">ایمیل (اختیاری)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
              />
            </div> */}

          {/* COMMENTED OUT - Additional fields for later profile completion
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
              />
            </div>
          </div>
          */}

          {/* COMMENTED OUT - Profile Information for later completion
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
            <DatePicker
              date={birthDate}
              setDate={(date) => {
                setBirthDate(date);
                if (date) {
                  handleInputChange('birth_date', date.toISOString().split('T')[0]);
                }
              }}
              placeholder="انتخاب تاریخ تولد"
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
          */}

          <Button type="submit" className="w-full"
          disabled={loading}
          // disabled={true}
          >
            {loading ? "در حال ثبت نام..." : "ثبت نام"}
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
    <form onSubmit={handleVerifyPhone}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">تایید شماره موبایل</h1>
          <p className="text-muted-foreground text-balance">
            کد تایید به شماره {phoneNumber} ارسال شد
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
          <Button type="button" variant="secondary" onClick={handleResendVerification}>ارسال مجدد کد</Button>

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
      <Card className="overflow-hidden p-0 w-full md:max-w-md mx-auto">
        <CardContent className="grid p-0">
          <div className="p-6 md:p-8">
            {step === 'form' && renderFormStep()}
            {step === 'verification' && renderVerificationStep()}
            {step === 'complete' && renderCompleteStep()}
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
        با کلید روی «ساخت حساب» شما با
        <a href="#"> شرایط خدمات </a>
        و
        <a href="#"> سیاست حفظ حریم خصوصی </a>
        ما موافقت می‌کنید.
      </div>
    </div>
  )
}
