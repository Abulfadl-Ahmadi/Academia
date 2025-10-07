import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"
import { MapPin, Save } from "lucide-react"

interface UserAddress {
  id?: number
  full_name: string
  phone_number: string
  province: string
  city: string
  postal_code: string
  address_line: string
  is_complete: boolean
  formatted_address?: string
}

export default function AddressPage() {
  const [address, setAddress] = useState<UserAddress>({
    full_name: '',
    phone_number: '',
    province: '',
    city: '',
    postal_code: '',
    address_line: '',
    is_complete: false
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)

  useEffect(() => {
    fetchAddress()
  }, [])

  const fetchAddress = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/accounts/address/')
      setAddress(response.data)
      setHasAddress(true)
    } catch {
      // Address doesn't exist yet
      setHasAddress(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      if (hasAddress) {
        await axiosInstance.put('/accounts/address/', address)
        toast.success('آدرس با موفقیت بروزرسانی شد')
      } else {
        const response = await axiosInstance.post('/accounts/address/', address)
        setAddress(response.data)
        setHasAddress(true)
        toast.success('آدرس با موفقیت ذخیره شد')
      }
      
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('خطا در ذخیره آدرس')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof UserAddress, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            مدیریت آدرس
          </CardTitle>
          <CardDescription>
            برای خرید محصولات فیزیکی، تکمیل آدرس الزامی است
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">نام کامل *</Label>
                <Input
                  id="full_name"
                  value={address.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone_number">شماره موبایل *</Label>
                <Input
                  id="phone_number"
                  value={address.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="09123456789"
                  pattern="^09\d{9}$"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">استان *</Label>
                <Input
                  id="province"
                  value={address.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  placeholder="تهران"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="city">شهر *</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="تهران"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="postal_code">کد پستی *</Label>
              <Input
                id="postal_code"
                value={address.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="1234567890"
                pattern="\d{10}"
                maxLength={10}
                required
              />
            </div>

            <div>
              <Label htmlFor="address_line">آدرس کامل *</Label>
              <Textarea
                id="address_line"
                value={address.address_line}
                onChange={(e) => handleChange('address_line', e.target.value)}
                placeholder="آدرس کامل شامل خیابان، کوچه، پلاک و واحد"
                rows={3}
                required
              />
            </div>

            {address.is_complete && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ آدرس شما کامل است و آماده ارسال محصولات فیزیکی می‌باشد
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {hasAddress ? 'بروزرسانی آدرس' : 'ذخیره آدرس'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}