export default function TestHistoryPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">تاریخچه آزمون‌ها</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 mb-6">تاریخچه آزمون‌های شما در این صفحه نمایش داده می‌شود.</p>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">آزمون شماره {index}</h3>
                <span 
                  className={`text-xs px-2 py-1 rounded-full ${
                    index % 3 === 0 
                      ? "bg-green-100 text-green-800" 
                      : index % 3 === 1 
                      ? "bg-red-100 text-red-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {index % 3 === 0 
                    ? "قبول" 
                    : index % 3 === 1 
                    ? "رد شده" 
                    : "ناتمام"}
                </span>
              </div>
              <div className="text-gray-500 text-sm mt-2">تاریخ: ۱۴۰۲/۰{index}/۰{index + 1}</div>
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">نمره: {Math.floor(Math.random() * 20) + 1}/20</span>
                  <span className="text-sm text-gray-500 mx-4">|</span>
                  <span className="text-sm text-gray-500">زمان: {30 + index * 5} دقیقه</span>
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
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
