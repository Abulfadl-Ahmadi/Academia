export default function ActiveTestsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">آزمون‌های فعال</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 mb-6">لیست آزمون‌های فعال شما در این صفحه نمایش داده می‌شود.</p>
        
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">آزمون شماره {index}</h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">فعال</span>
              </div>
              <div className="text-gray-500 text-sm mt-2">زمان باقیمانده: ۲ روز و ۵ ساعت</div>
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">تعداد سوالات: ۲۰</span>
                  <span className="text-sm text-gray-500 mx-4">|</span>
                  <span className="text-sm text-gray-500">زمان: ۶۰ دقیقه</span>
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                  شروع آزمون
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
