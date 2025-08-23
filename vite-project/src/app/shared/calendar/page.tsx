export default function CalendarPage() {
  // Simulate a month of data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Adjust for Persian calendar (week starts on Saturday)
  const adjustedFirstDay = (firstDayOfMonth + 1) % 7;
  
  // Create calendar days
  const days = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null); // Empty cells for days before the 1st of the month
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Events data (sample)
  const events = [
    { day: 5, title: "آزمون ریاضی", color: "bg-blue-100 border-blue-400" },
    { day: 12, title: "کلاس فیزیک", color: "bg-green-100 border-green-400" },
    { day: 15, title: "مهلت تکلیف", color: "bg-red-100 border-red-400" },
    { day: 18, title: "ارائه پروژه", color: "bg-purple-100 border-purple-400" },
    { day: 25, title: "جلسه آنلاین", color: "bg-yellow-100 border-yellow-400" },
  ];
  
  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    return events.filter(event => event.day === day);
  };
  
  // Persian month names
  const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">تقویم برنامه‌ها</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between mb-6 items-center">
          <button className="bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300">
            &gt;
          </button>
          <h2 className="text-xl font-medium">
            {persianMonths[currentMonth]} {currentYear}
          </h2>
          <button className="bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300">
            &lt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {/* Day names */}
          {["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"].map((day) => (
            <div key={day} className="text-center font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`border rounded-lg min-h-[100px] p-2 ${
                day === currentDate.getDate() ? "bg-blue-50 border-blue-300" : ""
              }`}
            >
              {day && (
                <>
                  <div className="text-right mb-1">{day}</div>
                  {getEventsForDay(day).map((event, eventIndex) => (
                    <div 
                      key={eventIndex} 
                      className={`text-xs p-1 mb-1 border-r-2 rounded ${event.color}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">برنامه‌های آینده</h3>
        
        <div className="space-y-4">
          {events
            .filter(event => event.day >= currentDate.getDate())
            .sort((a, b) => a.day - b.day)
            .map((event, index) => (
              <div key={index} className="flex items-center border-r-4 border-blue-500 bg-gray-50 p-3 rounded">
                <div className="font-bold text-lg ml-3">{event.day}</div>
                <div>{event.title}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
