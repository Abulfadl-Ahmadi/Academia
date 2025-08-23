export default function CompletedCoursesPage() {
  const completedCourses = [
    { id: 1, title: "فیزیک پایه دوازدهم", teacher: "استاد رضایی", completionDate: "۱۴۰۲/۰۲/۱۵", grade: "A" },
    { id: 2, title: "ریاضی پیشرفته", teacher: "استاد محمدی", completionDate: "۱۴۰۲/۰۱/۲۰", grade: "B+" },
    { id: 3, title: "شیمی آلی", teacher: "استاد علوی", completionDate: "۱۴۰۱/۱۲/۱۰", grade: "A-" },
    { id: 4, title: "زیست شناسی", teacher: "استاد حسینی", completionDate: "۱۴۰۱/۱۱/۰۵", grade: "A+" },
    { id: 5, title: "ادبیات فارسی", teacher: "استاد نادری", completionDate: "۱۴۰۱/۱۰/۲۵", grade: "B" },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">دوره‌های کامل شده</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 mb-6">لیست دوره‌هایی که با موفقیت به پایان رسانده‌اید.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-right">عنوان دوره</th>
                <th className="px-4 py-2 text-right">استاد</th>
                <th className="px-4 py-2 text-right">تاریخ اتمام</th>
                <th className="px-4 py-2 text-right">نمره نهایی</th>
                <th className="px-4 py-2 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {completedCourses.map((course) => (
                <tr key={course.id} className="border-b">
                  <td className="px-4 py-3">{course.title}</td>
                  <td className="px-4 py-3">{course.teacher}</td>
                  <td className="px-4 py-3">{course.completionDate}</td>
                  <td className="px-4 py-3">{course.grade}</td>
                  <td className="px-4 py-3">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 ml-2">
                      مشاهده گواهی
                    </button>
                    <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">آمار دوره‌های گذرانده</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-700">5</div>
              <div className="text-sm text-blue-600">کل دوره‌های کامل شده</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-700">A</div>
              <div className="text-sm text-green-600">میانگین نمرات</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-700">120</div>
              <div className="text-sm text-purple-600">ساعات آموزش</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
