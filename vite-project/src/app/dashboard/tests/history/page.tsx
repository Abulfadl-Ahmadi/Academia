export default function TestHistoryPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">تاریخچه آزمون‌ها</h1>

      <div className="bg-card text-card-foreground border p-6 rounded-lg shadow-xs">
        <p className="text-muted-foreground mb-6">تاریخچه آزمون‌های شما در این صفحه نمایش داده می‌شود.</p>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="border p-4 rounded-lg transition-colors hover:bg-muted/50">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">آزمون شماره {index}</h3>
                <span 
                  className={`text-xs px-2 py-1 rounded-full ${
                    index % 3 === 0 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                      : index % 3 === 1 
                      ? "bg-red-500/10 text-red-700 dark:text-red-400" 
                      : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {index % 3 === 0 
                    ? "قبول" 
                    : index % 3 === 1 
                    ? "رد شده" 
                    : "ناتمام"}
                </span>
              </div>
              <div className="text-muted-foreground text-sm mt-2">تاریخ: ۱۴۰۲/۰{index}/۰{index + 1}</div>
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <span className="text-sm text-muted-foreground">نمره: {Math.floor(Math.random() * 20) + 1}/20</span>
                  <span className="text-sm text-muted-foreground mx-4">|</span>
                  <span className="text-sm text-muted-foreground">زمان: {30 + index * 5} دقیقه</span>
                </div>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md transition-colors hover:bg-primary/90">
                  مشاهده جزئیات
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
