export const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: "نقدی",
    bank_transfer: "انتقال بانکی",
    credit_card: "کارت اعتباری",
    online_payment: "پرداخت آنلاین",
  };
  return labels[method] || method;
};

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "در انتظار",
    confirmed: "تأیید شده",
    paid: "پرداخت شده",
    cancelled: "لغو شده",
    refunded: "بازپرداخت شده",
  };
  return labels[status] || status;
};

export const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    confirmed: "secondary",
    paid: "default",
    cancelled: "destructive",
    refunded: "secondary",
  };
  return variants[status] || "default";
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fa-IR");
};
