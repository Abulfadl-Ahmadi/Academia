import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface RegistrationData {
  email: string;
  username: string;
  password: string;
}

interface SimpleRegistrationFormProps {
  className?: string;
}

export default function SimpleRegistrationForm({ 
  className, 
  ...props 
}: SimpleRegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use your existing register endpoint with the expected structure
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: '', // Empty string for simple registration
            last_name: '', // Empty string for simple registration
            role: 'student'
          },
          national_id: '', // Empty for simple registration
          phone_number: '', // Empty for simple registration
          birth_date: null, // Empty for simple registration
          grade: '' // Empty for simple registration
        }),
      });

      if (response.ok) {
        await response.json();
        // Store user info in localStorage for login
        localStorage.setItem('registration_complete', 'true');
        localStorage.setItem('user_email', formData.email);
        
        // Redirect to login page
        navigate('/login', { 
          state: { 
            message: 'ثبت نام با موفقیت انجام شد. اکنون وارد شوید.',
            email: formData.email 
          } 
        });
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || 'خطایی در ثبت نام رخ داد');
      }
    } catch {
      setError('خطایی در ارتباط با سرور رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">ثبت نام</h1>
                  <p className="text-muted-foreground text-balance">
                    برای شروع، اطلاعات پایه خود را وارد کنید
                  </p>
                </div>

                {error && (
                  <p className="text-red-500 text-center text-sm">{error}</p>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="email">ایمیل *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="username">نام کاربری *</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="نام کاربری"
                      required
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="password">رمز عبور *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="رمز عبور"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
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
        با کلید روی «ثبت نام» شما با
        <a href="#"> شرایط خدمات </a>
        و
        <a href="#"> سیاست حفظ حریم خصوصی </a>
        ما موافقت می‌کنید.
      </div>
    </div>
  );
}
