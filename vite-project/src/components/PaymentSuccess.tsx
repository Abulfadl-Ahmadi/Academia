import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useEffect, useRef } from "react"

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const refNumber = searchParams.get("refNumber")
  const trackId = searchParams.get("trackId")
  
  const referenceCode = refNumber || trackId || searchParams.get("ref_id")
  
  const { clearCart } = useCart()
  const cartClearedRef = useRef(false)

  // Clear cart when payment is successful - only once
  useEffect(() => {
    if (!cartClearedRef.current && referenceCode) {
      clearCart()
      cartClearedRef.current = true
    }
  }, [referenceCode, clearCart])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-500/20 shadow-lg shadow-green-500/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-green-500/10">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-green-600 text-2xl font-bold">پرداختت ترکوند! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            دمت گرم، خریدت با موفقیت انجام شد 🚀
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {referenceCode && (
            <div className="p-4 bg-muted/50 rounded-xl border">
              <p className="text-sm text-muted-foreground mb-1">کد پیگیری سفارشت:</p>
              <p className="font-mono text-xl font-bold text-primary tracking-wider">{referenceCode}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link to="/panel/courses" className="block">
              <Button className="w-full py-6 text-lg rounded-xl shadow-md transition-all hover:scale-[1.02]">
                بزن بریم سراغ دوره‌هات 🎯
              </Button>
            </Link>
            <Link to="/shop" className="block">
              <Button variant="outline" className="w-full rounded-xl">
                بازگشت به فروشگاه
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
