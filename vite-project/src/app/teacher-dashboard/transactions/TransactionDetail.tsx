import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TransactionDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance
      .get(`/finance/transactions/${id}/`)
      .then((res) => {
        setTransaction(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("خطا در دریافت جزئیات تراکنش");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!transaction) return <div>ترانزاکشی یافت نشد</div>;

  const t = transaction;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>جزئیات تراکنش #{t.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">نوع تراکنش</div>
              <div className="font-medium">{t.transaction_type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">مبلغ</div>
              <div className="font-medium">{t.amount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">روش پرداخت</div>
              <div className="font-medium">{t.payment_method}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">شماره مرجع</div>
              <div className="font-medium">{t.reference_number || '-'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-muted-foreground">توضیحات</div>
              <div className="font-medium whitespace-pre-wrap">{t.description || '-'}</div>
            </div>
          </div>

          {/* Payments sent by gateway/bank */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">پرداخت‌های مرتبط</h3>
            {t.payments && t.payments.length > 0 ? (
              <div className="space-y-4">
                {t.payments.map((p: any) => (
                  <div key={p.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">شناسه پرداخت (trackId)</div>
                        <div className="font-medium">{p.track_id || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">شماره مرجع بانک (refNumber)</div>
                        <div className="font-medium">{p.ref_number || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">کارت</div>
                        <div className="font-medium">{p.card_number || '-'}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div>وضعیت: <Badge>{p.status}</Badge></div>
                      <div>مبلغ (ریال): {p.amount}</div>
                      <div>شرح: {p.description || '-'}</div>
                      <div>ایجاد شده: {p.created_at ? format(new Date(p.created_at), 'yyyy/MM/dd HH:mm') : '-'}</div>
                      <div className="mt-2">
                        <details>
                          <summary className="cursor-pointer text-sm text-blue-600">نمایش payload کامل</summary>
                          <pre className="whitespace-pre-wrap mt-2 text-xs bg-muted/20 p-2 rounded">{JSON.stringify(p, null, 2)}</pre>
                        </details>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>پرداخت مرتبطی ثبت نشده است.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
