export default function UploadFilePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">آپلود فایل جدید</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 mb-6">لطفا فایل مورد نظر خود را انتخاب و آپلود کنید.</p>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">عنوان فایل:</label>
          <input 
            type="text" 
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="عنوان فایل را وارد کنید" 
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">توضیحات فایل:</label>
          <textarea 
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="توضیحات فایل را وارد کنید"
            rows={3}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">فایل:</label>
          <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center">
            <p className="text-gray-500 mb-2">فایل خود را در اینجا بکشید و رها کنید</p>
            <p className="text-gray-400 text-sm mb-4">یا</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md">انتخاب فایل</button>
            <input type="file" className="hidden" />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
            آپلود فایل
          </button>
        </div>
      </div>
    </div>
  );
}
