import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Loader2, Pencil, Plus, RotateCcw, Save, Send, Smartphone, Sparkles, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Recipient = { id: number; name: string; username: string; phone_number: string };
type Config = {
  id: number;
  name: string;
  is_active: boolean;
  message_type: "bulk" | "verify";
  template_id: number | null;
  template_parameters: Record<string, string>;
  product_types: string[];
  min_order_amount: number | null;
  trigger_statuses: string[];
  template_text: string;
  admin_users: number[];
  custom_phone_numbers: string[];
};
type Log = { id: number; config_name: string; order_code: string; phone_number: string; status: string; error_message: string; created_at: string };

const emptyConfig: Omit<Config, "id"> = {
  name: "گزارش فروش موفق",
  is_active: true,
  message_type: "bulk",
  template_id: null,
  template_parameters: {},
  product_types: [],
  min_order_amount: null,
  trigger_statuses: ["paid"],
  template_text: "فروش جدید {order_code} | {product_titles} | {total_amount} تومان",
  admin_users: [],
  custom_phone_numbers: [],
};

const fakeSampleData = {
  order_code: "ORD-9821",
  customer_name: "کاربر آزمایشی",
  customer_phone: "09123456789",
  total_amount: "550,000",
  product_titles: "دوره جامع برنامه‌نویسی پایتون",
  product_types: "دوره آموزشی",
  order_date: "۱۴۰۳/۰۵/۲۷ ۱۰:۳۰",
  items_count: "1",
};

const parsePhones = (value: string) => value.split(/[\n,،]+/).map((item) => item.trim()).filter(Boolean);
const resultList = <T,>(data: T[] | { results?: T[] }) => Array.isArray(data) ? data : data.results || [];

export default function SmsReportsPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [form, setForm] = useState<Omit<Config, "id">>(emptyConfig);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [parameterDraft, setParameterDraft] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test SMS states
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);

  const selectConfig = (config: Config) => {
    setSelectedId(config.id);
    setForm({ ...config });
    setPhoneDraft((config.custom_phone_numbers || []).join("\n"));
    setParameterDraft(JSON.stringify(config.template_parameters || {}, null, 2));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [configResponse, logResponse, recipientResponse] = await Promise.all([
        axiosInstance.get("/finance/sms-notifications/"),
        axiosInstance.get("/finance/sms-notification-logs/?page_size=8"),
        axiosInstance.get("/finance/sms-notifications/recipients/"),
      ]);
      const configItems = resultList<Config>(configResponse.data);
      setConfigs(configItems);
      setLogs(resultList<Log>(logResponse.data));
      setRecipients(recipientResponse.data);
      if (configItems.length && selectedId === null) selectConfig(configItems[0]);
    } catch {
      toast.error("اطلاعات گزارش خودکار بارگذاری نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = <K extends keyof Omit<Config, "id">>(key: K, value: Omit<Config, "id">[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const selectedRecipients = useMemo(() => new Set(form.admin_users), [form.admin_users]);

  const createNew = () => {
    setSelectedId(null);
    setForm({ ...emptyConfig });
    setPhoneDraft("");
    setParameterDraft("{}");
  };

  const openTestModal = () => {
    const defaultPhones = parsePhones(phoneDraft);
    if (defaultPhones.length > 0 && !testPhone) {
      setTestPhone(defaultPhones[0]);
    } else if (!testPhone && recipients.length > 0) {
      const found = recipients.find((r) => r.phone_number);
      if (found) setTestPhone(found.phone_number);
    }
    setTestModalOpen(true);
  };

  const renderedPreview = useMemo(() => {
    if (form.message_type === "verify") {
      try {
        const parsed = JSON.parse(parameterDraft || "{}");
        const rendered = Object.entries(parsed).map(([key, value]) => {
          let str = String(value);
          Object.entries(fakeSampleData).forEach(([k, v]) => {
            str = str.replaceAll(`{${k}}`, v);
          });
          return `${key}: "${str}"`;
        });
        return `شناسه الگو: ${form.template_id || "وارد نشده"}\nپارامترها:\n${rendered.join("\n") || "بدون پارامتر"}`;
      } catch {
        return "پارامترهای وارد شده JSON معتبر نیستند.";
      }
    }

    let text = form.template_text || "";
    Object.entries(fakeSampleData).forEach(([k, v]) => {
      text = text.replaceAll(`{${k}}`, v);
    });
    return text;
  }, [form.message_type, form.template_text, form.template_id, parameterDraft]);

  const handleSendTestSms = async () => {
    if (!testPhone.trim()) {
      toast.error("لطفاً شماره موبایل را وارد کنید.");
      return;
    }

    let templateParameters: Record<string, string> = {};
    if (form.message_type === "verify") {
      try {
        templateParameters = JSON.parse(parameterDraft || "{}");
      } catch {
        toast.error("پارامترهای الگو باید JSON معتبر باشد.");
        return;
      }
      if (!form.template_id) {
        toast.error("شناسه الگو را وارد کنید.");
        return;
      }
    }

    setTestSending(true);
    try {
      const payload = {
        ...form,
        config_id: selectedId || undefined,
        template_parameters: templateParameters,
        phone_number: testPhone.trim(),
      };

      const response = await axiosInstance.post("/finance/sms-notifications/test/", payload);
      if (response.data?.success) {
        toast.success("پیامک تستی واقعی با موفقیت ارسال شد! موبایل خود را بررسی نمایید.");
        setTestModalOpen(false);
      } else {
        toast.error(response.data?.message || "ارسال پیامک با خطا مواجه شد.");
      }

      // Refresh log table to immediately show the test log
      const logResponse = await axiosInstance.get("/finance/sms-notification-logs/?page_size=8");
      setLogs(resultList<Log>(logResponse.data));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.detail || "خطا در برقراری ارتباط با سامانه پیامک.");
    } finally {
      setTestSending(false);
    }
  };

  const save = async () => {
    let templateParameters: Record<string, string>;
    try {
      templateParameters = JSON.parse(parameterDraft || "{}");
    } catch {
      toast.error("پارامترهای الگو باید JSON معتبر باشد.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        template_parameters: templateParameters,
        custom_phone_numbers: parsePhones(phoneDraft),
        min_order_amount: form.min_order_amount || null,
      };
      const response = selectedId
        ? await axiosInstance.patch(`/finance/sms-notifications/${selectedId}/`, payload)
        : await axiosInstance.post("/finance/sms-notifications/", payload);
      const saved = response.data as Config;
      setConfigs((items) => selectedId ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
      selectConfig(saved);
      toast.success("تنظیمات گزارش ذخیره شد.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "ذخیره تنظیمات انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedId || !window.confirm("این تنظیم گزارش حذف شود؟")) return;
    try {
      await axiosInstance.delete(`/finance/sms-notifications/${selectedId}/`);
      setConfigs((items) => items.filter((item) => item.id !== selectedId));
      createNew();
      toast.success("گزارش حذف شد.");
    } catch {
      toast.error("حذف گزارش انجام نشد.");
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">گزارش خودکار SMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">تنظیم اطلاع‌رسانی پیامکی پس از فروش موفق محصول</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openTestModal} className="border-primary/30 text-primary hover:bg-primary/5">
            <Send className="size-4 ml-1" /> تست ارسال پیامک
          </Button>
          <Button onClick={createNew}><Plus className="size-4" /> تنظیم جدید</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="border-b">
            <CardTitle className="text-base">تنظیمات ذخیره‌شده</CardTitle>
            <CardDescription>یک گزارش را برای ویرایش انتخاب کنید.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
            ) : configs.length ? configs.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => selectConfig(config)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-3 text-right transition-colors hover:bg-muted/50 ${selectedId === config.id ? "border-primary bg-muted" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{config.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{config.message_type === "bulk" ? "پیامک متنی" : "پیامک الگویی"}</span>
                </span>
                <Badge variant={config.is_active ? "default" : "outline"}>{config.is_active ? "فعال" : "غیرفعال"}</Badge>
              </button>
            )) : (
              <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">هنوز گزارشی ثبت نشده است.</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4" /> {selectedId ? "ویرایش گزارش" : "ایجاد گزارش جدید"}</CardTitle>
              <CardDescription className="mt-1">پیامک فقط پس از ثبت فروش موفق ارسال می‌شود.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={openTestModal} title="تست ارسال همین پیامک به موبایل">
                <Send className="size-3.5 ml-1" /> تست پیامک
              </Button>
              {selectedId ? <Button variant="outline" size="sm" onClick={createNew}><Pencil className="size-4" /> جدید</Button> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="report-name">نام تنظیم</Label><Input id="report-name" value={form.name} onChange={(event) => update("name", event.target.value)} /></div>
              <div className="flex items-center justify-between rounded-md border px-4 py-2.5"><div><Label htmlFor="report-active">وضعیت ارسال</Label><p className="mt-1 text-xs text-muted-foreground">فعال‌بودن ارسال برای فروش‌های موفق</p></div><Switch id="report-active" checked={form.is_active} onCheckedChange={(value) => update("is_active", value)} /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>نوع پیامک</Label><Select value={form.message_type} onValueChange={(value: Config["message_type"]) => update("message_type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bulk">متن آزاد</SelectItem><SelectItem value="verify">الگوی sms.ir</SelectItem></SelectContent></Select></div>
              {form.message_type === "verify" ? <div className="space-y-2"><Label htmlFor="template-id">شناسه الگو</Label><Input id="template-id" type="number" value={form.template_id || ""} onChange={(event) => update("template_id", event.target.value ? Number(event.target.value) : null)} /></div> : <div className="space-y-2"><Label htmlFor="min-amount">حداقل مبلغ سفارش (تومان)</Label><Input id="min-amount" type="number" value={form.min_order_amount || ""} onChange={(event) => update("min_order_amount", event.target.value ? Number(event.target.value) : null)} /></div>}
            </div>

            <div className="space-y-2"><Label htmlFor="sms-text">متن پیامک</Label><Textarea id="sms-text" className="min-h-28 leading-7" value={form.template_text} onChange={(event) => update("template_text", event.target.value)} /><p className="text-xs text-muted-foreground">متغیرهای قابل استفاده: &#123;order_code&#125;، &#123;product_titles&#125;، &#123;total_amount&#125;، &#123;customer_name&#125;</p></div>

            {form.message_type === "verify" ? <div className="space-y-2"><Label htmlFor="template-parameters">پارامترهای الگو (JSON)</Label><Textarea id="template-parameters" className="min-h-24 font-mono text-left" dir="ltr" value={parameterDraft} onChange={(event) => setParameterDraft(event.target.value)} placeholder={'{"OrderCode":"{order_code}"}'} /></div> : null}

            <div className="grid gap-6 border-t pt-6 md:grid-cols-2">
              <div className="space-y-3"><div><Label>گیرندگان پنل</Label><p className="mt-1 text-xs text-muted-foreground">فقط کاربرانی که شماره ثبت‌شده دارند قابل انتخاب‌اند.</p></div><div className="max-h-52 space-y-1 overflow-auto rounded-md border p-2">{recipients.map((person) => <label key={person.id} className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 hover:bg-muted"><span><span className="block text-sm">{person.name}</span><span className="block text-xs text-muted-foreground" dir="ltr">{person.phone_number || "شماره ثبت نشده"}</span></span><input type="checkbox" className="size-4 accent-primary" checked={selectedRecipients.has(person.id)} disabled={!person.phone_number} onChange={(event) => update("admin_users", event.target.checked ? [...form.admin_users, person.id] : form.admin_users.filter((id) => id !== person.id))} /></label>)}</div></div>
              <div className="space-y-2"><Label htmlFor="custom-phones">شماره‌های ثابت</Label><Textarea id="custom-phones" className="min-h-52 font-mono text-left" dir="ltr" placeholder={"0912...\n0919..."} value={phoneDraft} onChange={(event) => setPhoneDraft(event.target.value)} /><p className="text-xs text-muted-foreground">هر شماره را در یک خط یا با کاما وارد کنید.</p></div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={!selectedId} onClick={remove}><Trash2 className="size-4" /> حذف تنظیم</Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={openTestModal} type="button">
                  <Send className="size-4 ml-1" /> تست پیامک واقعی
                </Button>
                <Button onClick={save} disabled={saving}>{saving ? "در حال ذخیره..." : <><Save className="size-4" /> ذخیره تغییرات</>}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-base">آخرین ارسال‌ها</CardTitle>
            <CardDescription>نتیجه تلاش‌های اخیر برای ارسال پیامک فروش و تست‌ها</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={load} title="به‌روزرسانی جدول لاگ‌ها">
            <RotateCcw className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-right text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">شماره</th>
                    <th className="p-4 font-medium">تنظیم</th>
                    <th className="p-4 font-medium">سفارش</th>
                    <th className="p-4 font-medium">وضعیت</th>
                    <th className="p-4 font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-4 font-mono text-left" dir="ltr">{log.phone_number}</td>
                      <td className="p-4">{log.config_name || "—"}</td>
                      <td className="p-4">
                        {log.order_code ? (
                          <span>{log.order_code}</span>
                        ) : (
                          <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">تست دستی</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge className="w-fit" variant={log.status === "success" ? "default" : "destructive"}>
                            {log.status === "success" ? <><Check className="size-3 ml-1" /> موفق</> : "ناموفق"}
                          </Badge>
                          {log.status !== "success" && log.error_message ? (
                            <span className="text-[11px] text-destructive max-w-[240px] truncate" title={log.error_message}>{log.error_message}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(log.created_at).toLocaleString("fa-IR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">هنوز تلاش ارسالی ثبت نشده است.</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Live Test SMS */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-5 text-primary" /> ارسال پیامک تستی به موبایل
            </DialogTitle>
            <DialogDescription className="text-xs">
              با استفاده از داده‌های فیکِ پیش‌فرض (کد سفارش، نام دوره، مبلغ و...) یک پیامک واقعی از طریق پنل پیامک به شماره شما ارسال می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="test-phone">شماره موبایل دریافت‌کننده پیامک تستی</Label>
              <Input
                id="test-phone"
                dir="ltr"
                className="font-mono text-left"
                placeholder="0912xxxxxxx"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">شماره موبایل خود را با فرمت 09xxxxxxxxx وارد کنید.</p>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between font-medium text-foreground pb-1 border-b border-border/50">
                <span className="flex items-center gap-1.5"><Sparkles className="size-3.5 text-primary" /> داده‌های نمونه برای قالب</span>
                <Badge variant="secondary" className="text-[10px]">فیک / آزمایشی</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div>کد سفارش: <span className="font-mono text-foreground" dir="ltr">{fakeSampleData.order_code}</span></div>
                <div>مبلغ: <span className="text-foreground">{fakeSampleData.total_amount} تومان</span></div>
                <div className="col-span-2 truncate">محصول: <span className="text-foreground">{fakeSampleData.product_titles}</span></div>
                <div>خریدار: <span className="text-foreground">{fakeSampleData.customer_name}</span></div>
                <div>تاریخ: <span className="text-foreground">{fakeSampleData.order_date}</span></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">پیش‌نمایش متن پیامکی که ارسال می‌شود:</Label>
              <div className="rounded-md border bg-card p-3 text-xs leading-6 text-foreground font-sans whitespace-pre-wrap min-h-16">
                {renderedPreview}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTestModalOpen(false)} disabled={testSending}>
              انصراف
            </Button>
            <Button onClick={handleSendTestSms} disabled={testSending} className="gap-1.5">
              {testSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> در حال ارسال به درگاه...
                </>
              ) : (
                <>
                  <Send className="size-4" /> ارسال پیامک واقعی
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

