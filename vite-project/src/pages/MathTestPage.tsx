import { MathRenderer } from '@/components/ui/math-renderer-optimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MathTestPage() {
  const testContent = `
# تست نمایش ریاضیات - فرمت بهینه شده

## مثال آموزشی برای AI - این فرمت مطلوب است:

**مثال انتگرال سطحی:**

فرض کنید $S$ قسمتی از کره $x^2 + y^2 + z^2 = 4$ با شعاع 2 باشد که در اکتان اول ($x \\geq 0$, $y \\geq 0$, $z \\geq 0$) قرار دارد. می‌خواهیم $\\iint_{S} (x^2 + xy) \\, dS$ را محاسبه کنیم.

**1. پارامتریزاسیون:**

بهترین روش برای پارامتریزاسیون کره، استفاده از مختصات کروی است:

- $x = 2\\sin(\\phi)\\cos(\\theta)$
- $y = 2\\sin(\\phi)\\sin(\\theta)$  
- $z = 2\\cos(\\phi)$

از آنجا که در اکتان اول هستیم:

- $0 \\leq \\theta \\leq \\frac{\\pi}{2}$
- $0 \\leq \\phi \\leq \\frac{\\pi}{2}$

بنابراین: $\\mathbf{r}(\\phi, \\theta) = \\langle 2\\sin(\\phi)\\cos(\\theta), 2\\sin(\\phi)\\sin(\\theta), 2\\cos(\\phi) \\rangle$

**2. محاسبه مشتقات جزئی:**

- $\\mathbf{r}_{\\phi} = \\langle 2\\cos(\\phi)\\cos(\\theta), 2\\cos(\\phi)\\sin(\\theta), -2\\sin(\\phi) \\rangle$
- $\\mathbf{r}_{\\theta} = \\langle -2\\sin(\\phi)\\sin(\\theta), 2\\sin(\\phi)\\cos(\\theta), 0 \\rangle$

**3. ضرب خارجی:**

$$\\mathbf{r}_{\\phi} \\times \\mathbf{r}_{\\theta} = \\langle 4\\sin^2(\\phi)\\cos(\\theta), 4\\sin^2(\\phi)\\sin(\\theta), 4\\sin(\\phi)\\cos(\\phi) \\rangle$$

**4. اندازه ضرب خارجی:**

$$\\|\\mathbf{r}_{\\phi} \\times \\mathbf{r}_{\\theta}\\| = \\sqrt{16\\sin^4(\\phi)\\cos^2(\\theta) + 16\\sin^4(\\phi)\\sin^2(\\theta) + 16\\sin^2(\\phi)\\cos^2(\\phi)}$$

$$= \\sqrt{16\\sin^4(\\phi) + 16\\sin^2(\\phi)\\cos^2(\\phi)} = \\sqrt{16\\sin^2(\\phi)} = 4\\sin(\\phi)$$

**5. جایگذاری در انتگرال:**

$$x^2 + xy = 4\\sin^2(\\phi)\\cos^2(\\theta) + 4\\sin^2(\\phi)\\cos(\\theta)\\sin(\\theta)$$

انتگرال سطحی به شکل زیر می‌شود:

$$\\iint_{S} (x^2 + xy) \\, dS = \\int_{0}^{\\pi/2} \\int_{0}^{\\pi/2} [4\\sin^2(\\phi)\\cos^2(\\theta) + 4\\sin^2(\\phi)\\cos(\\theta)\\sin(\\theta)] \\cdot 4\\sin(\\phi) \\, d\\phi \\, d\\theta$$

**6. محاسبه انتگرال دوگانه:**

$$= 16 \\int_{0}^{\\pi/2} \\sin^3(\\phi) \\, d\\phi \\cdot \\left[ \\int_{0}^{\\pi/2} \\cos^2(\\theta) \\, d\\theta + \\int_{0}^{\\pi/2} \\cos(\\theta)\\sin(\\theta) \\, d\\theta \\right]$$

- $\\int_{0}^{\\pi/2} \\sin^3(\\phi) \\, d\\phi = \\frac{2}{3}$
- $\\int_{0}^{\\pi/2} \\cos^2(\\theta) \\, d\\theta = \\frac{\\pi}{4}$  
- $\\int_{0}^{\\pi/2} \\cos(\\theta)\\sin(\\theta) \\, d\\theta = \\frac{1}{2}$

**نتیجه نهایی:**

$$\\iint_{S} (x^2 + xy) \\, dS = \\frac{8(\\pi + 2)}{3}$$

---

## نکات مهم برای AI:

1. ✅ استفاده از $...$ برای فرمول‌های inline
2. ✅ استفاده از $$...$$ برای فرمول‌های block  
3. ✅ استفاده از LaTeX commands مثل \\sin, \\cos, \\int
4. ✅ استفاده از ^ برای توان و _ برای زیرنویس
5. ❌ عدم استفاده از HTML tags مثل <sub> یا <sup>
6. ❌ عدم استفاده از نمادهای یونیکد بدون $ $

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

## فرمول پیچیده:

$$
f(x) = \\int_{-\\infty}^x e^{-t^2} dt = \\frac{1}{\\sqrt{\\pi}} \\int_{-\\infty}^x e^{-t^2} dt
$$

## کد عادی:
\`\`\`python
def calculate_area(radius):
    return 3.14159 * radius ** 2
\`\`\`

## لیست:
1. فرمول اول: $a^2 + b^2 = c^2$
2. فرمول دوم: $\\sin^2(x) + \\cos^2(x) = 1$
3. فرمول سوم: $e^{i\\pi} + 1 = 0$
`;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>تست نمایش ریاضیات</CardTitle>
        </CardHeader>
        <CardContent>
          <MathRenderer content={testContent} />
        </CardContent>
      </Card>
    </div>
  );
}

export default MathTestPage;
