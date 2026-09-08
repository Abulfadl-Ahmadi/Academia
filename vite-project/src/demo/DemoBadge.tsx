/**
 * Small persistent marker so nobody mistakes the offline demo build for the
 * live site — it explains why nothing saves. Rendered only in demo builds.
 */
export function DemoBadge() {
  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        insetInlineStart: "1rem",
        insetBlockEnd: "1rem",
        zIndex: 2147483000,
        maxWidth: "min(20rem, calc(100vw - 2rem))",
        padding: "0.5rem 0.85rem",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(20, 18, 29, 0.82)",
        backdropFilter: "blur(10px)",
        color: "#ece9f5",
        font: "500 0.78rem/1.6 Ravi, Vazirmatn, system-ui, sans-serif",
        boxShadow: "0 10px 30px -12px rgba(0,0,0,0.7)",
        pointerEvents: "none",
      }}
    >
      نسخهٔ نمایشی آفلاین — فقط مشاهده
    </div>
  );
}
