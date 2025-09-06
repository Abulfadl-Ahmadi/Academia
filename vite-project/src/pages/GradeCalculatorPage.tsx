import GradeCalculator from '@/components/GradeCalculator'
import Navbar from '@/components/navbar'
import { Footer } from '@/components/Footer'

export default function GradeCalculatorPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              محاسبه‌گر درصد آزمون
            </h1>
            <p className="text-muted-foreground">
              درصد خود را با در نظر گیری نمره منفی محاسبه کنید
            </p>
          </div>
          <GradeCalculator />
        </div>
      </div>
      <Footer />
    </>
  )
}
