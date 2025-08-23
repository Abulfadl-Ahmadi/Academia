export default function NewTransactionPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ثبت تراکنش جدید</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 mb-6">لطفا اطلاعات تراکنش جدید را وارد کنید.</p>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">دانش‌آموز:</label>
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">انتخاب دانش‌آموز</option>
            <option value="1">دانش‌آموز 1</option>
            <option value="2">دانش‌آموز 2</option>
            <option value="3">دانش‌آموز 3</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">نوع تراکنش:</label>
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">انتخاب نوع تراکنش</option>
            <option value="payment">پرداخت</option>
            <option value="refund">بازگشت وجه</option>
            <option value="charge">شارژ اعتبار</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">مبلغ (تومان):</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="مبلغ را وارد کنید" 
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">توضیحات تراکنش:</label>
          <textarea 
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="توضیحات تراکنش را وارد کنید"
            rows={3}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">تاریخ تراکنش:</label>
          <input 
            type="date" 
            className="w-full p-2 border border-gray-300 rounded-md" 
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">شماره پیگیری:</label>
          <input 
            type="text" 
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="شماره پیگیری را وارد کنید" 
          />
        </div>
        
        <div className="flex justify-end mt-6">
          <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 mr-2">
            انصراف
          </button>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
            ثبت تراکنش
          </button>
        </div>
      </div>
    </div>
  );
}
