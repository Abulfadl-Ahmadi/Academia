import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"

export function PaymentFailed() {
  const [searchParams] = useSearchParams()
  const authority = searchParams.get("authority")

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-800">پرداخت ناموفق</CardTitle>
          <CardDescription>
            پرداخت شما انجام نشد یا لغو شد
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {authority && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">کد authority:</p>
              <p className="font-mono text-sm">{authority}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              اگر مبلغی از حساب شما کسر شده، ظرف ۲۴ ساعت آینده بازگردانده خواهد شد.
            </p>
          </div>

          <div className="space-y-2">
            <Link to="/shop">
              <Button className="w-full">
                بازگشت به فروشگاه
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.history.back()}
            >
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
