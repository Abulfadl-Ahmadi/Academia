RESTFUL API
برای راحتی هر چه بیشتر در ارسال پیام‌ها، وب سرویس‌های کاربردی از نوع RESTful در اختیار توسعه‌دهندگان قرار داده شده است. وب سرویس‌های RESTful می‌توانند با استفاده از هر زبان برنامه‌نویسی و یا شیوه دلخواه دیگر فراخوانی و مورد استفاده قرار گیرند.

مقدمه
Sandbox
ارسال‌ها
گزارش‌ها
تنظیمات
جداول کدهای وضعیت
در این بخش مفاهیم و قراردادهای کلی مربوط به استفاده از وب سرویس sms.ir، شرح داده خواهند شد.

- HTTP REQUEST HEADER
شما می‌توانید برای انجام تنظیمات ضروری و یا شخصی سازی شده، از هدرهای مشخص شده در جدول زیر استفاده نمایید.

کلید	مقدار	عملکرد
ACCEPT	application/json یا application/xml	دریافت خروجی با فرمت Json یا Xml
X-API-KEY	کلید تعریف شده در پنل	احراز هویت
- HTTP STATUS CODE
تمامی درخواست های ارسالی دارای HTTP status code های بازگشتی مطابق جدول زیر می‌باشند.

کد وضعیت	توضیح
200	عملیات موفقیت آمیز
400	وقوع خطای منطقی
401	وجود خطا در فرآیند احراز هویت
429	تعداد درخواست غیر مجاز
500	خطای غیر منتظره
- UNIX Time
واحد مقادیر مربوط به زمان در سطح این سامانه به صورت Unix Time و بر حسب ساعت هماهنگ جهانی (UTC) لحاظ شده است.

- مدل بازگشتی
تمامی درخواست های ارسالی دارای مدل بازگشتی یکپارچه با ساختار زیر می‌باشند.

Response Body
{
    "status":1,
    "message":"موفق",
    "data":[
     30004505000027,
     10002166593818
    ]
}
مشخصه	توضیح
Status	کد وضعیت
Message	توضیحات وضعیت درخواست
Data	دیتای بازگشتی
- AUTHORIZATION – احراز هویت
به منظور هویت سنجی در هنگام استفاده از وب سرویس‌های SMS.ir ملزم به ارسال کلید خصوصی در بخش هدر درخواست مورد نظر می‌باشید. کلید های خصوصی شما در پنل برنامه نویسان قابل مشاهده و مدیریت می‌باشند.در هنگام فراخوانی متدهای سامانه کلید خصوصی را با عنوان X-API-KEY در هدر درخواست قرار دهید.

X-API-KEY
PN1TVeBeaAehFLJAKU4XdfpsFXsQguYfleO0bV4ceh6diTZid2hRXza3uSkBbDef


Sandbox محیطی تستی برای کاربران و توسعه‌دهندگان است که امکان آزمایش عملکرد درخواست‌ها را پیش از استفاده در محیط اصلی (Production) فراهم می‌کند. این محیط با داده‌های شبیه‌سازی‌شده به کاربران کمک می‌کند تا بدون ارسال پیامک واقعی یا کسر اعتبار، درخواست‌های خود را بررسی و بهینه کنند.

- ویژگی‌های محیط Sandbox
1. کلید API مخصوص Sandbox
 برای استفاده از Sandbox باید از API Key مخصوص این محیط استفاده شود.

 ساختار URLها، ورودی‌ها و خروجی‌ها مشابه محیط اصلی است.

 کلید Sandbox از مسیر زیر قابل ایجاد است: برنامه‌نویسان ← لیست کلیدهای API ← ایجاد کلید جدید

2. داده‌های شبیه‌سازی‌شده
 پاسخ‌های بازگشتی شبیه‌سازی‌شده و فاقد اعتبار واقعی هستند.

 خطاهای بازگشتی مشابه محیط اصلی هستند و صحت ورودی‌ها را بررسی می‌کنند.

3. قالب پیش‌فرض متد Verify در محیط Sandbox
 در محیط Sandbox، فقط یک قالب پیش‌فرض برای متد Verify فعال است:

 شناسه قالب: 123456

 متن قالب: کد تایید شما: #CODE#

این قالب پیش‌فرض به کاربران این امکان را می‌دهد که در شرایطی مانند عدم راه‌اندازی کامل سایت، نبود اینماد، یا توسعه محیط آزمایشی، کدهای خود را با استفاده از کلید وب‌سرویس نوع Sandbox در محیط تست بررسی و آزمایش کنند.

4. عدم ثبت گزارشات
 اطلاعات بازگشتی تنها در پاسخ به درخواست‌ها نمایش داده می‌شود و گزارشی در سامانه ثبت نمی‌شود.

نکات کلیدی:
کلید مخصوص Sandbox: ارسال‌ها در این محیط به‌صورت شبیه‌سازی‌شده انجام می‌شوند، بدون اینکه پیامکی واقعی ارسال شود یا هزینه‌ای کسر گردد.

عدم ثبت گزارشات: گزارشی از ارسال‌ها در سامانه ثبت نمی‌شود و فقط پاسخ‌ها در همان لحظه نمایش داده می‌شوند.

تطابق با محیط اصلی: ورودی‌ها، خروجی‌ها و پیام‌های خطا مشابه محیط اصلی هستند.

داده‌های شبیه‌سازی‌شده: تمامی داده‌های بازگشتی صرفاً برای شبیه‌سازی عملکرد API ارائه می‌شوند و اعتبار واقعی ندارند.

- نحوه استفاده از محیط Sandbox
1. ایجاد کلید Sandbox
 به بخش برنامه‌نویسان ← لیست کلیدهای API ← ایجاد کلید جدید (نوع: Sandbox) مراجعه کنید.

 کلید ایجادشده را در هدر درخواست‌ها وارد کنید.

2. ارسال درخواست
 درخواست‌ها را با همان ساختار و URLهای محیط اصلی ارسال کنید.

- نمونه درخواست ارسال Verify
URL
https://api.sms.ir/v1/send/verify
Request Method
POST
Header
{
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'x-api-key': 'YOUR_SANDBOX_API_KEY'
}
Request Body
{
    "mobile": "919xxxx904",
    "templateId": 123456,
    "parameters": [
      {
        "name": "Code",
        "value": "12345"
      }
    ]
}
- بررسی پاسخ‌ها
در صورت موفقیت:

Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
        "messageId": 89545112,
        "cost": 1.0
    }
}



- ارسال گروهی
این متد برای ارسال یک متن پیامک به گروهی از شماره موبایل ها مورد استفاده قرار میگیرد. همچنین شما می‌توانید با مقداردهی به پارامتر زمان ارسال، از قابلیت ارسال پیامک زمانبندی شده نیز استفاده نمایید.

URL

https://api.sms.ir/v1/send/bulk
Request Method
POST
حداکثر تعداد مجاز شماره‌های مقصد 100 می‌باشد.

برای ارسال زمانبندی شده، انتخاب زمان گذشته نامعتبر می‌باشد.

برای ارسال زمانبندی شده، زمان معتبر می‎‌تواند در بازه یک ساعت آینده تا حداکثر 365 روز آینده در نظر گرفته شود.

پارامترهای بدنه درخواست

مشخصه	ارسال	نوع	توضیح
lineNumber	اجباری	Long	شماره خط ارسالی
MessageText	اجباری	String	متن پیام کوتاه
Mobiles	اجباری	Array of String	شماره موبایل‌ها
SendDateTime	اختیاری	UnixTime	زمان ارسال پیامک (در صورت خالی بودن، ارسال در لحظه انجام می‌شود)
مدل دیتای بازگشتی

مشخصه	نوع	توضیح
PackId	Guid	شناسه یکتای مجموعه ارسال
MessageIds	Array of Integer	آرایه ای از شناسه های یکتای هر پیامک
Cost	Decimal	اعتبار مصرفی مجموعه ارسال
Request Body
{
    "lineNumber": 30004505000017,
    "messageText": "سرویس پیامکی ایده پردازان با بیش از یک دهه سابقه همراه شماست",
    "mobiles": [
        "00912xxxx677",
          "0919xxxx904"
    ]
}
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
        "packId": "2b99e63c-9bf8-4a21-9bfe-3f72dc1b46f1",
        "messageIds": [
            86522023,
            86522024
        ],
        "cost": 2.0
    }
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = json.dumps({
        "lineNumber": 300000000000,
        "messageText": "Your Text",
        "mobiles": [
          "Your Mobile 1",
          "Your Mobile 2"
        ],
        "sendDateTime": None
      })
      headers = {
        'X-API-KEY': 'YOURAPIKEY',
        'Content-Type': 'application/json'
      }
      conn.request("POST", "/v1/send/bulk", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))

      


      - ارسال نظیر به نظیر
این متد برای ارسال به گروهی از موبایل‌ها با متن‌های متفاوت برای هر کدام، مورد استفاده قرار می‌گیرد. همچنین شما می‌توانید با مقداردهی به پارامتر زمان ارسال، از قابلیت ارسال پیامک زمانبندی شده نیز استفاده نمایید.

URL

https://api.sms.ir/v1/send/likeToLike
Request Method
POST
حداکثر تعداد مجاز شماره‌های مقصد 100 می‌باشد.

برای ارسال زمانبندی شده، انتخاب زمان گذشته نامعتبر می‌باشد.

برای ارسال زمانبندی شده، زمان معتبر می‎‌تواند در بازه یک ساعت آینده تا حداکثر 365 روز آینده در نظر گرفته شود.

تعداد شماره موبایل‌ها و متن‌های پیامک باید برابر باشند.

پارامترهای بدنه درخواست

مشخصه	ارسال	نوع	توضیح
lineNumber	اجباری	Long	شماره خط ارسالی
MessageTexts	اجباری	Array of String	متن های پیام کوتاه
Mobiles	اجباری	Array of String	شماره موبایل‌ها
SendDateTime	اختیاری	UnixTime	زمان ارسال پیامک (در صورت خالی بودن، ارسال در لحظه انجام می‌شود)
مدل دیتای بازگشتی

مشخصه	نوع	توضیح
PackId	Guid	شناسه یکتای مجموعه ارسال
MessageIds	Array of Integer	آرایه ای از شناسه های یکتای هر پیامک
Cost	Decimal	اعتبار مصرفی مجموعه ارسال
Request Body
{
    "lineNumber": "30004505000017",
    "messageTexts": [
        "سرویس پیامکی ایده پردازان با بیش از یک دهه سابقه همراه شماست",
        "ipdemy.ir  پلتفرم آموزش آنلاین، آکادمی ایده پردازان"
    ],
    "mobiles": [
        "912xxxx677",
        "+98919xxxx904"
    ]
}
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
        "packId": "2b99e63c-9bf8-4a21-9bfe-3f72dc1b46f1",
        "messageIds": [
            86522023,
            86522024
        ],
        "cost": 2.0
    }
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = json.dumps({
        "lineNumber": 300000000000,
        "messageTexts": [
          "Your Text 1",
          "Your Text 2"
        ],
        "mobiles": [
          "Your Mobile 1",
          "Your Mobile 1"
        ],
        "senddatetime": None
      })
      headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("POST", "/v1/send/likeToLike", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    


    - حذف ارسال زمانبندی شده
به‌منظور حذف و انصراف از ارسال زمانبندی شده می‌توانید از متد زیر استفاده نمایید. در این متد، شناسه مجموعه ارسال (packId) دریافتی از خروجی ارسال گروهی یا نظیر به نظیر، مورد استفاده قرار می‌گیرد.

URL

https://api.sms.ir/v1/send/scheduled/{packId}
Request Method
DELETE
حداکثر تا 3 دقیقه مانده به زمان ارسال زمانبندی شده، مجاز به لغو آن می‌باشید.

پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
PackId	اجباری	Guid	شناسه مجموعه ارسال
مدل دیتای بازگشتی

مشخصه	نوع	توضیح
ReturnedCreditCount	Decimal	مقدار اعتبار بازگشتی
SmsCount	Integer	تعداد پیامک‌ها
Request
https://api.sms.ir/v1/send/scheduled/2b99e63c-9bf8-4a21-9bfe-3f72dc1b46f1
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
      "returnedCreditCount": 10.0,
      "smsCount": 5
    }
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'Accept': 'text/plain',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("DELETE", "/v1/send/scheduled/:Packid", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    



    - ارسال VERIFY
با استفاده از این متد شما قادر به ارسال پیامک به منظور ارسال کد اعتبارسنجی (verification code)، کد تایید، فاکتور خرید و به طور کلی پیامک‌هایی با اولویت بالا و پارامترهای پویا می‌باشید. از آنجایی که این نوع از ارسال با خطوط خدماتی ارسال میشود امکان دریافت آن توسط افرادی که پیامک‌های تبلیغاتی خود را مسدود کرده‌اند نیز وجود دارد و با اولویت بالایی ارسال خواهد شد.برای استفاده از این نوع ارسال ابتدا قالب پیامک خود را در پنل (بخش ارسال سریع) مشخص نمایید.

URL

https://api.sms.ir/v1/send/verify
Request Method
POST
پارامترهای بدنه درخواست

مشخصه	ارسال	نوع	توضیح
Mobile	اجباری	String	شماره موبایل
TemplateId	اجباری	Integer	شناسه قالب (قالب ها از طریق پنل قابل تعریف و مدیریت می‌باشند)
Parameters	اجباری	Array of Parameter Model	آرایه ای از مدل parameter برای تعیین مقادیر جایگزین شونده در قالب تعریف شده (ساختار مدل parameter در جدول زیر ذکر شده است)
مدل Parameter

مشخصه	ارسال	نوع	توضیح
Name	اجباری	String	کلید تعیین شده در قالب (بدون در نظر گرفتن # در ابتدا و انتهای آن)
Value	اجباری	String	مقدار کلید تعیین شده برای جایگزینی در قالب پیامک (حداکثر 25 کاراکتر)
مدل دیتای بازگشتی

مشخصه	نوع	توضیح
MessageId	Integer	شناسه یکتای پیامک
Cost	Decimal	اعتبار مصرفی ارسال
Request Body
{
    "mobile": "919xxxx904",
    "templateId": 123456,
    "parameters": [
      {
        "name": "Code",
        "value": "12345"
      }
    ]
}
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
        "messageId": 89545112,
        "cost": 1.0
    }
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = "{\n  \"mobile\": \"Your Mobile\",\n  \"templateId\": YourTemplateID,\n
       \"parameters\": [\n    {\n      \"name\": \"PARAMETER1\",\n      \"value\": \"000000\"\n    },
       \n    {\n        \"name\":\"PARAMETER2\",\n        \"value\":\"000000\"\n    }\n  ]\n}"
      headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'x-api-key': 'YOURAPIKEY'
      }
      conn.request("POST", "/v1/send/verify", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))

    


    - ارسال از طریق URL
این متد برای ارسال پیامک از طریق URL مورد استفاده قرار می‌گیرد. برای ارسال کافی است پارامترهای مورد نیاز را در قالب Query Params در آدرس مشخص شده قرار دهید.

URL

https://api.sms.ir/v1/send
Request Method
GET, POST
پارامترهای بدنه درخواست

مشخصه	ارسال	نوع	توضیح
Username	اجباری	String	نام کاربری
Password	اجباری	String	کلید خصوصی (کلیدهای خصوصی شما در پنل برنامه‌نویسان قابل مشاهده و مدیریت می‌باشند.)
Line	اجباری	Long	شماره خط
Mobile	اجباری	String	شماره موبایل
Text	اجباری	String	متن پیامک
مدل دیتای بازگشتی

مشخصه	نوع	توضیح
MessageId	Integer	شناسه یکتای پیامک
Cost	Decimal	اعتبار مصرفی ارسال
Request URL
https://api.sms.ir/v1/send?username=MY_USERNAME&password=MY_APIKEY&line=LINE_NUMBER&mobile=MOBILE&text="MESSAGE_TEXT"
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
        "messageId": 89545112,
        "cost": 1.0
    }
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'Accept': 'text/plain'
      }
      conn.request(
        "GET",
       "/v1/send?username=MY_USERNAME&password=MY_APIKEY&mobile=MOBILE&line=LINE_NUMBER&text=MESSAGE_TEXT",
        payload,
        headers
        )
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))


- گزارش پیامک (دریافت وضعیت)
شما می‌توانید با استفاده از شناسه یکتای پیامک که پس از انجام هریک از ارسال‌ها دریافت کرده‌اید، با فراخوانی این متد، به دریافت اطلاعات پیامک و همینطور اطلاع از وضعیت (Delivery) آن اقدام نمایید.

URL

https://api.sms.ir/v1/send/{messageId}
Request Method
GET
مدل دیتای بازگشتی

مشخصه	نوع	توضیح
MessageId	Integer	شناسه یکتای پیامک
Mobile	Long	شماره موبایل
MessageText	String	متن پیامک
SendDateTime	Integer (UnixTime)	زمان ارسال
LineNumber	Long	شماره خط
Cost	Decimal	اعتبار کسر شده
DeliveryState	Nullable Byte	وضعیت دلیوری
DeliveryDateTime	Nullable Integer (UnixTime)	زمان دلیوری
Request
https://api.sms.ir/v1/send/89545112
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": {
        "messageId": 89545112,
        "mobile": 912xxxx677,
        "messageText": "سرویس پیامکی ایده پردازان با بیش از یک دهه سابقه همراه شماست",
        "sendDateTime": 1628683626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 1,
        "deliveryDateTime": 1628683629
    }
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/send/:MessageID", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))

    


    - گزارش مجموعه ارسال‌های روز
شما می‌توانید با استفاده از این گزارش اطلاعات کلی مجموعه ارسال‌های روز جاری را دریافت نمایید.

URL

https://api.sms.ir/v1/send/pack
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
PageSize	اختیاری	Integer	تعداد آیتم‌های در صفحه (حداکثر:100 ، پیش فرض: 100)
PageNumber	اختیاری	Integer	شماره صفحه درخواستی (مقدار پیشفرض 1 می‌باشد)
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
packId	GUID	شناسه مجموعه
recipientCount	Number	تعداد مخاطبان
creationDateTime	Number	زمان ایجاد
Request
https://api.sms.ir/v1/send/pack
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [{
        "packId": e7c09e23f0db4834b9bcb79e7b054f4c,
        "recipientCount": 100,
        "creationDateTime": 1628683626,
    },{
       "packId": 0cf3017fd9d84babbb5ed5579104dab2,
        "recipientCount": 200,
        "creationDateTime": 1628683626,
    }]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'Accept': 'text/plain',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/send/pack?pageNumber=1&pageSize=100", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))

    

    - گزارش مجموعه ارسال
شما می‌توانید با استفاده از شناسه مجموعه ارسال، گزارشی از پیامک‌های ارسالی در آن درخواست به‌ همراه وضعیت‌هایشان را دریافت نمایید.

URL

https://api.sms.ir/v1/send/pack/{packId}
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
PackId	اجباری	Guid	شناسه مجموعه ارسال
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
MessageId	Integer	شناسه یکتای پیامک
Mobile	Long	شماره موبایل
MessageText	String	متن پیامک
SendDateTime	Integer (UnixTime)	زمان ارسال
LineNumber	Long	شماره خط
Cost	Decimal	اعتبار کسر شده
DeliveryState	Nullable Byte	وضعیت دلیوری
DeliveryDateTime	Nullable Integer (UnixTime)	زمان دلیوری
Request
https://api.sms.ir/v1/send/pack/bdec19c9-2736-4095-8ef1-ea21afe3771f
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [{
        "messageId": 89545112,
        "mobile": 912xxxx677,
        "messageText": "سرویس پیامکی ایده پردازان با بیش از یک دهه سابقه همراه شماست",
        "sendDateTime": 1628683626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 1,
        "deliveryDateTime": 1628683629
    },{
        "messageId": 89545113,
        "mobile": 919xxxx378,
        "messageText": "ipdemy.ir پلتفرم آموزش آنلاین، آکادمی ایده پردازان",
        "sendDateTime": 1628683626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 3,
        "deliveryDateTime": 1628683625
    }]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'PageSize': '2',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/send/pack/:PackID", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    


    - گزارش ارسال‌های روز
با استفاده از متد زیر، گزارشی از ارسال‌های انجام شده در روز جاری قابل دریافت است.

URL

https://api.sms.ir/v1/send/live
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
PageSize	اختیاری	Integer	تعداد آیتم‌های در صفحه (حداکثر:100 ، پیش فرض: 100)
PageNumber	اختیاری	Integer	شماره صفحه درخواستی (مقدار پیشفرض 1 می‌باشد)
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
MessageId	Integer	شناسه یکتای پیامک
Mobile	Long	شماره موبایل
MessageText	String	متن پیامک
SendDateTime	Integer (UnixTime)	زمان ارسال
LineNumber	Long	شماره خط
Cost	Decimal	اعتبار کسر شده
DeliveryState	Nullable Byte	وضعیت دلیوری
DeliveryDateTime	Nullable Integer (UnixTime)	زمان دلیوری
Request
https://api.sms.ir/v1/send/live?pageSize=25&pageNumber=3
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [{
        "messageId": 89545112,
        "mobile": 912xxxx677,
        "messageText": "سرویس پیامکی ایده پردازان با بیش از یک دهه سابقه همراه شماست",
        "sendDateTime": 1628683626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 1,
        "deliveryDateTime": 1628683629
    },{
        "messageId": 89545113,
        "mobile": 919xxxx378,
        "messageText": "ipdemy.ir پلتفرم آموزش آنلاین، آکادمی ایده پردازان",
        "sendDateTime": 1628683626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 3,
        "deliveryDateTime": 1628683625
    }]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'Accept': 'text/plain',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/send/live?pageNumber=1&pageSize=20", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    


    - گزارش ارسال‌های آرشیو شده
با فراخوانی متد زیر، گزارشی از ارسال‌های انجام شده در گذشته (تا انتهای روز قبل)، را دریافت خواهید نمود.

URL

https://api.sms.ir/v1/send/archive
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
FromDate	اختیاری	Integer (UnixTime)	از تاریخ
ToDate	اختیاری	Integer (UnixTime)	تا تاریخ
PageSize	اختیاری	Integer	تعداد آیتم‌های در صفحه (حداکثر:100 ، پیش فرض: 100)
PageNumber	اختیاری	Integer	شماره صفحه درخواستی (مقدار پیشفرض 1 می‌باشد)
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
MessageId	Integer	شناسه یکتای پیامک
Mobile	Long	شماره موبایل
MessageText	String	متن پیامک
SendDateTime	Integer (UnixTime)	زمان ارسال
LineNumber	Long	شماره خط
Cost	Decimal	اعتبار کسر شده
DeliveryState	Nullable Byte	وضعیت دلیوری
DeliveryDateTime	Nullable Integer (UnixTime)	زمان دلیوری
Request
https://api.sms.ir/v1/send/archive?fromDate=1613465574&toDate=1623805200
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [{
        "messageId": 89545112,
        "mobile": 912xxxx677,
        "messageText": "سرویس پیامکی ایده پردازان با بیش از یک دهه سابقه همراه شماست",
        "sendDateTime": 1628583626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 1,
        "deliveryDateTime": 1628683629
    },{
        "messageId": 89545113,
        "mobile": 919xxxx378,
        "messageText": "ipdemy.ir پلتفرم آموزش آنلاین، آکادمی ایده پردازان",
        "sendDateTime": 1628583626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 3,
        "deliveryDateTime": 1628683625
    },{
        "messageId": 89545114,
        "mobile": 921xxxx432,
        "messageText": "HyperBox.irفروشگاه اینترنتی اسباب بازی و عروسک ",
        "sendDateTime": 1628583626,
        "lineNumber": 30004505000017,
        "cost": 1.0,
        "deliveryState": 1,
        "deliveryDateTime": 1628683669
    }]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'Accept': 'text/plain',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/send/archive?pageNumber=1&pageSize=100&fromDate=1650016645&toDate=1650880645", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    


    - گزارش تازه‌ترین پیامک‌های دریافتی
شما می‌توانید با استفاده از این متد، تازه‌ترین پیامک‌های دریافتی را مشاهده نمایید. لازم به ذکر است هر پیامک دریافتی تنها یک مرتبه توسط این متد قابل دستیابی می‌باشد و پس از آن به دلیل قرار گرفتن در حالت خوانده شده قابل دسترسی مجدد توسط این متد نمی‌باشند.

URL

https://api.sms.ir/v1/receive/latest
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
Count	اختیاری	Integer	تعداد درخواستی (حداکثر تعداد درخواستی و مقدار پیشفرض 100 می‌باشد)
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
ReceiveReturnId	Long	شناسه یکتای پیامک دریافتی
MessageText	String	متن پیامک
Number	Long	شماره خط دریافت‌کننده
Mobile	Long	شماره موبایل ارسال کننده
ReceivedDateTime	Integer (UnixTime)	زمان دریافت
Request
https://api.sms.ir/v1/receive/latest?count=50
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [
        {
            "receiveReturnId": 123456789,
            "messageText": "HyperBox.irفروشگاه اینترنتی اسباب بازی و عروسک",
            "number": 30004505000017,
            "mobile": 912xxxx002,
            "receivedDateTime": 1628683625
        }
    ]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/receive/latest?count=100", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    

    - گزارش پیامک‌های دریافتی روز
با فراخوانی متد زیر، گزارش پیامک‌های دریافتی روز جاری (اعم از خوانده شده و نشده) قابل دستیابی می‌باشد.

در آغازین ساعات روز، گزارش پیام های دریافتی روز گذشته نیز با فراخوانی این متد قابل دریافت می‌باشد.

URL

https://api.sms.ir/v1/receive/live
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
PageSize	اختیاری	Integer	تعداد آیتم‌های در صفحه (حداکثر:100 ، پیش فرض: 100)
PageNumber	اختیاری	Integer	شماره صفحه درخواستی (مقدار پیشفرض 1 می‌باشد)
sortByNewest	اختیاری	Boolean	مرتب سازی بر اساس تاریخ دریافت (پیش فرض به صورت صعودی، با مقدار False)
mobile	اختیاری	String	شماره موبایل ارسال کننده پیامک
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
Mobile	Long	شماره موبایل ارسال کننده
MessageText	String	متن پیامک
Number	Long	شماره خط دریافت‌کننده
ReceivedDateTime	Integer (UnixTime)	زمان دریافت
Request
https://api.sms.ir/v1/receive/live?pageSize=20&pageNumber=3&sortByNewest=false
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [
        {
            "messageText": "HyperBox.irفروشگاه اینترنتی اسباب بازی و عروسک",
            "number": 30004505000017,
            "mobile": 912xxxx002,
            "receivedDateTime": 1628683625
        }
    ]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'PageSize': '2',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/receive/live?pageNumber=1&pageSize=100", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    

    - گزارش پیامک‌های دریافتی آرشیو شده
با فراخوانی متد زیر، گزارشی از پیامک‌های دریافتی در گذشته (تا انتهای روز قبل)، را مشاهده خواهید نمود.

URL

https://api.sms.ir/v1/receive/archive
Request Method
GET
پارامترهای درخواست

مشخصه	ارسال	نوع	توضیح
FromDate	اختیاری	Integer (UnixTime)	از تاریخ
ToDate	اختیاری	Integer (UnixTime)	تا تاریخ
PageSize	اختیاری	Integer	تعداد آیتم‌های در صفحه (حداکثر:100 ، پیش فرض: 100)
PageNumber	اختیاری	Integer	شماره صفحه درخواستی (مقدار پیشفرض 1 می‌باشد)
mobile	اختیاری	String	شماره موبایل ارسال کننده پیامک
مدل دیتای بازگشتی (آرایه‌ای از مدل زیر)

مشخصه	نوع	توضیح
ReceiveReturnId	Long	شناسه پیامک دریافتی
MessageText	String	متن پیامک
Number	Long	شماره خط دریافت‌کننده
Mobile	Long	شماره موبایل ارسال کننده
ReceivedDateTime	Integer (UnixTime)	زمان دریافت
Request
https://api.sms.ir/v1/receive/archive?fromDate=1613465574&toDate=1623805200
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [
        {
            "receiveReturnId": 12345678987,
            "messageText": "HyperBox.irفروشگاه اینترنتی اسباب بازی و عروسک",
            "number": 30004505000017,
            "mobile": 912xxxx002,
            "receivedDateTime": 1628683625
        }
    ]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'PageSize': '2',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/receive/archive?pageNumber=1&pageSize=100&fromDate=1628683629&toDate=1628693629", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    

    - دریافت مقدار اعتبار فعلی
برای مشاهده مقدار اعتبار فعلی از متد زیر استفاده نمایید.

URL

https://api.sms.ir/v1/credit
Request Method
GET
دیتای بازگشتی

نوع	توضیح
Decimal	مقدار اعتبار
Request
https://api.sms.ir/v1/credit
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": 165.3
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/credit", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    


    - دریافت لیست خطوط
با استفاده از این متد، لیست خطوط آماده استفاده برای ارسال، قابل مشاهده است.

URL

https://api.sms.ir/v1/line
Request Method
GET
دیتای بازگشتی (آرایه ای از Long)

نوع	توضیح
Long	شماره خط
Request
https://api.sms.ir/v1/line
Response Body
{
    "status": 1,
    "message": "موفق",
    "data": [10002155613464, 30004505000017]
}
نمونه کد

C#
JS
Node.js
PHP
Python
Java


      conn = http.client.HTTPSConnection("api.sms.ir")
      payload = ''
      headers = {
        'PageSize': '2',
        'X-API-KEY': 'YOURAPIKEY'
      }
      conn.request("GET", "/v1/line", payload, headers)
      res = conn.getresponse()
      data = res.read()
      print(data.decode("utf-8"))
    


    کدهای وضعیت‌

کد وضعیت	توضیح
0	درخواست شما با خطا مواجه شده‌است.
1	عملیات با موفقیت انجام شد
10	کلید وب سرویس نامعتبر است
11	کلید وب سرویس غیرفعال است
12	کلید وب سرویس محدود به آی‌پی‌های تعریف شده می‌باشد.
13	حساب کاربری غیرفعال است
14	حساب کاربری در حالت تعلیق قرار دارد
15	به منظور استفاده از وب سرویس پلن خود را ارتقا دهید
16	مقدار ارسالی پارامتر نادرست می‌باشد
20	تعداد درخواست بیشتر از حد مجاز است
101	شماره خط نامعتبر میباشد
102	اعتبار کافی نمیباشد
103	درخواست شما دارای متن (های) خالی است
104	درخواست شما دارای موبایل (های) نادرست است
105	تعداد موبایل ها بیشتر از حد مجاز (100 عدد) میباشد
106	تعداد متن ها بیشتر از حد مجاز (100 عدد) میباشد
107	لیست موبایل ها خالی میباشد
108	لیست متن ها خالی میباشد
109	زمان ارسال نامعتبر میباشد
110	تعداد شماره موبایل ها و تعداد متن ها برابر نیستند
111	با این شناسه ارسالی ثبت نشده است
112	رکوردی برای حذف یافت نشد
113	قالب یافت نشد
114	طول رشته مقدار پارامتر، بیش از حد مجاز (25 کاراکتر) میباشد
115	شماره موبایل(ها) در لیست سیاه سامانه می‌باشند
116	نام یک یا چند پارامتر مقداردهی نشده‌است. لطفا به بخش مستندات ارسال وریفای مراجعه فرمایید
117	متن ارسال شده مورد تایید نمی‌باشد
118	تعداد پیام ها بیشتر از حد مجاز میباشد
119	به منظور استفاده از قالب‌ شخصی سازی شده پلن خود را ارتقا دهید
123	خط ارسال‌کننده نیاز به فعال‌سازی دارد.
124	درحال حاضر، فقط امکان ارسال پیامک OTP وجود دارد و قالب شما OTP شناسایی نشده است!
کدهای وضعیت دلیوری

کد وضعیت	توضیح
1	رسیده
2	نرسیده به گوشی
3	رسیده به مخابرات
4	نرسیده به مخابرات
5	رسیده به اپراتور
6	ناموفق
7	لیست سیاه
8	نامشخص


