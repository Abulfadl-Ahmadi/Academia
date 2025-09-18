import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axiosInstance from "@/lib/axios"


export function PaymentInitiate() {
  const [searchParams] = useSearchParams()
  const [orderId] = useState(searchParams.get('orderId') || "")
  const [amount] = useState(searchParams.get('amount') || "")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await axiosInstance.post("/finance/payment/initiate/", {
        order_id: parseInt(orderId),
        amount: parseInt(amount),
        description: description || `پرداخت سفارش ${orderId}`
      })

      // Redirect to payment gateway
      window.location.href = response.data.payment_url
    } catch (err: unknown) {
      console.error("Payment initiation error:", err)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } }
        if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error)
        } else {
          setError("خطا در شروع پرداخت. لطفاً دوباره تلاش کنید.")
        }
      } else {
        setError("خطا در شروع پرداخت. لطفاً دوباره تلاش کنید.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>شروع پرداخت</CardTitle>
          <CardDescription>
            اطلاعات سفارش خود را وارد کنید تا به درگاه پرداخت هدایت شوید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">شماره سفارش</Label>
              <Input
                id="orderId"
                type="text"
                value={orderId}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">مبلغ (تومان)</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات پرداخت"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "در حال انتقال به درگاه..." : "پرداخت"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
