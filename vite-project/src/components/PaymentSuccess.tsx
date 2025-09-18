import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const refId = searchParams.get("ref_id")

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">پرداخت موفق</CardTitle>
          <CardDescription>
            پرداخت شما با موفقیت انجام شد
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {refId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">کد پیگیری:</p>
              <p className="font-mono text-lg font-semibold">{refId}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              سفارش شما در حال پردازش است و به زودی به حساب کاربری شما اضافه خواهد شد.
            </p>
          </div>

          <div className="space-y-2">
            <Link to="/panel">
              <Button className="w-full">
                مشاهده پنل کاربری
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" className="w-full">
                بازگشت به فروشگاه
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
