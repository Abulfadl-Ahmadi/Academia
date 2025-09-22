/**
 * تابع تبدیل اعداد انگلیسی به فارسی (روش ساده و کارآمد)
 */
export const convertNumbersToFarsi = (text: string): string => {
  const englishToPersian = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  
  return text.replace(/[0-9]/g, (match) => 
    englishToPersian[match as keyof typeof englishToPersian]
  );
};