import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, BookOpen, ClipboardList, Download, Package, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useEffect, useRef, useState } from "react"
import axiosInstance from "@/lib/axios"

interface PaymentAction {
  label: string
  url: string
}

interface PurchasedItem {
  id: number
  product_id: number
  title: string
  product_type: string
  price: number
  quantity: number
  course_id?: number
  test_id?: number
  file_id?: number
}

interface PaymentInfo {
  track_id: number | null
  ref_number: string
  payment_status: string
  order_id: number | null
  order_code: string | null
  total_amount: number
  items: PurchasedItem[]
  primary_action: PaymentAction | null
  actions: PaymentAction[]
}

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const rawRefNumber = searchParams.get("refNumber")
  const rawTrackId = searchParams.get("trackId")
  const rawRefId = searchParams.get("ref_id")

  // Sanitize values to eliminate literal 'None' or 'null' strings
  const cleanRef = (val: string | null) => {
    if (!val || val === "None" || val === "null" || val.trim() === "") return null
    return val.trim()
  }

  const refNumber = cleanRef(rawRefNumber)
  const trackId = cleanRef(rawTrackId)
  const refId = cleanRef(rawRefId)

  const referenceCode = refNumber || trackId || refId

  const { clearCart } = useCart()
  const cartClearedRef = useRef(false)

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Clear cart when payment is successful - only once
  useEffect(() => {
    if (!cartClearedRef.current && (referenceCode || rawTrackId)) {
      clearCart()
      cartClearedRef.current = true
    }
  }, [referenceCode, rawTrackId, clearCart])

  // Fetch payment & order information
  useEffect(() => {
    let isMounted = true

    const fetchPaymentInfo = async () => {
      try {
        setLoading(true)
        const params: Record<string, string> = {}
        if (trackId) params.trackId = trackId
        if (refNumber) params.refNumber = refNumber

        const res = await axiosInstance.get<PaymentInfo>("/finance/payment/info/", { params })
        if (isMounted && res.data) {
          setPaymentInfo(res.data)
        }
      } catch (err) {
        console.warn("Could not fetch detailed payment info:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPaymentInfo()

    return () => {
      isMounted = false
    }
  }, [trackId, refNumber])

  const getItemIcon = (type: string) => {
    switch (type) {
      case "test":
        return <ClipboardList className="w-4 h-4 text-amber-500" />
      case "course":
        return <BookOpen className="w-4 h-4 text-blue-500" />
      case "file":
      case "pamphlet":
        return <Download className="w-4 h-4 text-emerald-500" />
      case "book":
      case "notebook":
      case "stationery":
        return <Package className="w-4 h-4 text-purple-500" />
      default:
        return <ShoppingBag className="w-4 h-4 text-primary" />
    }
  }

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case "test":
        return "آزمون"
      case "course":
        return "دوره آموزشی"
      case "file":
        return "فایل دانلودی"
      case "pamphlet":
        return "جزوه"
      case "book":
        return "کتاب"
      case "notebook":
        return "دفتر"
      case "stationery":
        return "لوازم تحریر"
      default:
        return "محصول"
    }
  }

  const displayRefCode = paymentInfo?.ref_number || referenceCode

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-green-500/20 shadow-lg shadow-green-500/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-green-500/10">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-green-600 text-2xl font-bold">پرداختت با موفقیت انجام شد! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            خرید شما نهایی شد و دسترسی به محصولات برای شما فعال گردید 🚀
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {displayRefCode && (
            <div className="p-4 bg-muted/50 rounded-xl border">
              <p className="text-sm text-muted-foreground mb-1">کد پیگیری سفارشت:</p>
              <p className="font-mono text-xl font-bold text-primary tracking-wider">{displayRefCode}</p>
            </div>
          )}

          {/* Purchased items list */}
          {paymentInfo && paymentInfo.items && paymentInfo.items.length > 0 && (
            <div className="text-right space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">اقلام خریداری شده:</p>
              <div className="bg-muted/30 rounded-xl p-3 divide-y divide-border/60 border">
                {paymentInfo.items.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getItemIcon(item.product_type)}
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                      {getItemTypeBadge(item.product_type)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Navigation Action Buttons */}
          <div className="space-y-3 pt-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : paymentInfo?.actions && paymentInfo.actions.length > 0 ? (
              paymentInfo.actions.map((act, idx) => (
                <Link key={idx} to={act.url} className="block">
                  <Button
                    variant={idx === 0 ? "default" : "secondary"}
                    className={`w-full ${idx === 0 ? "py-6 text-lg font-bold shadow-md hover:scale-[1.02]" : "py-5 text-base"} rounded-xl transition-all flex items-center justify-center gap-2`}
                  >
                    <span>{act.label}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              ))
            ) : (
              // Fallback buttons if payment info couldn't be loaded
              <>
                <Link to="/panel/test-collections" className="block">
                  <Button className="w-full py-6 text-lg rounded-xl shadow-md transition-all hover:scale-[1.02]">
                    مشاهده آزمون‌های من 📝
                  </Button>
                </Link>
                <Link to="/panel/courses" className="block">
                  <Button variant="secondary" className="w-full py-5 text-base rounded-xl">
                    بزن بریم سراغ دوره‌هات 🎯
                  </Button>
                </Link>
              </>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/panel/products" className="block">
                <Button variant="outline" className="w-full rounded-xl text-xs sm:text-sm">
                  محصولات من
                </Button>
              </Link>
              <Link to="/shop" className="block">
                <Button variant="outline" className="w-full rounded-xl text-xs sm:text-sm">
                  بازگشت به فروشگاه
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
