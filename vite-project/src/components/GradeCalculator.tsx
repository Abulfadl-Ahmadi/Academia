import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Calculator } from 'lucide-react'

interface CalculationResult {
  finalPercentage: number
  netCorrect: number
  negativePoints: number
}

export default function GradeCalculator() {
  const [correct, setCorrect] = useState<number>(0)
  const [wrong, setWrong] = useState<number>(0)
  const [blank, setBlank] = useState<number>(0)
  const [total, setTotal] = useState<number>(20)
  const [result, setResult] = useState<CalculationResult | null>(null)

  const calculateGrade = () => {
    // محاسبه نمره منفی: هر ۳ سوال غلط یک سوال درست را حذف می‌کند
    const negativePoints = Math.floor(wrong / 3)
    const netCorrect = correct - negativePoints  // حذف Math.max برای اجازه دادن به نمرات منفی
    
    // محاسبه درصد نهایی
    const finalPercentage = total > 0 ? (netCorrect / total) * 100 : 0

    setResult({
      finalPercentage: Math.round(finalPercentage * 100) / 100,
      netCorrect,
      negativePoints
    })
  }

  const resetForm = () => {
    setCorrect(0)
    setWrong(0)
    setBlank(0)
    setTotal(20)
    setResult(null)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Calculator className="h-6 w-6" />
            محاسبه درصد آزمون
          </CardTitle>
          <CardDescription>
            با در نظر گیری نمره منفی - هر ۳ سوال غلط یک سوال درست را حذف می‌کند
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correct">تعداد سوالات درست</Label>
              <Input
                id="correct"
                type="number"
                min="0"
                value={correct}
                onChange={(e) => setCorrect(Number(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wrong">تعداد سوالات غلط</Label>
              <Input
                id="wrong"
                type="number"
                min="0"
                value={wrong}
                onChange={(e) => setWrong(Number(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="blank">تعداد سوالات نزده</Label>
              <Input
                id="blank"
                type="number"
                min="0"
                value={blank}
                onChange={(e) => setBlank(Number(e.target.value) || 0)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="total">تعداد کل سوالات</Label>
              <Input
                id="total"
                type="number"
                min="1"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value) || 1)}
                className="text-center"
              />
            </div>
          </div>

          {/* نمایش خلاصه */}
          <div className=" p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              مجموع پاسخ داده شده: {correct + wrong + blank} از {total}
            </p>
            {correct + wrong + blank !== total && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  تعداد سوالات وارد شده با کل سوالات مطابقت ندارد
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={calculateGrade} className="flex-1">
              محاسبه درصد
            </Button>
            <Button onClick={resetForm} variant="outline">
              پاک کردن
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نمایش نتیجه */}
      {result && (
        <Card className={`border-2 ${result.finalPercentage >= 0 ? 'border-green-500/10 bg-green-500/5' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className={`${result.finalPercentage >= 0 ? 'text-green-800' : 'text-red-800'}`}>نتیجه محاسبه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${result.finalPercentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {result.finalPercentage}%
              </div>
              <p className={`${result.finalPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>درصد نهایی شما</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg">
                <div className="text-2xl font-semibold text-blue-600">{correct}</div>
                <div className="text-sm text-muted-foreground">سوالات درست</div>
              </div>
              <div className="p-3 rounded-lg">
                <div className="text-2xl font-semibold text-red-600">{wrong}</div>
                <div className="text-sm text-muted-foreground">سوالات غلط</div>
              </div>
              <div className="p-3 rounded-lg">
                <div className="text-2xl font-semibold text-muted-foreground">{blank}</div>
                <div className="text-sm text-muted-foreground">سوالات نزده</div>
              </div>
            </div>

            {(result.negativePoints > 0 || result.netCorrect < 0) && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">نمره منفی:</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  {result.negativePoints} سوال درست به علت {wrong} سوال غلط کسر شد
                </p>
                <p className="text-sm text-red-600">
                  تعداد نهایی سوالات درست: {result.netCorrect}
                  {result.netCorrect < 0 && ' (منفی)'}
                </p>
              </div>
            )}
            
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                از مجموع {total} سوال، {result.netCorrect} سوال صحیح محاسبه شده است
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
