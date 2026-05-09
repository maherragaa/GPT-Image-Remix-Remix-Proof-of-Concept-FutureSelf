import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const LANGUAGES = [
  'English', 
  'Arabic'
] as const;

export type Language = typeof LANGUAGES[number];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: {},
  Arabic: {
    "Dashboard": "لوحة القيادة",
    "Food Log": "سجل الطعام",
    "Health Projections": "التوقعات الصحية",
    "Profile Active": "الملف نشط",
    "Profile Details": "تفاصيل الملف الشخصي",
    "Reset All Data": "إعادة تعيين",
    "Age": "العمر",
    "Gender": "الجنس",
    "Height (cm)": "الطول (سم)",
    "Weight (kg)": "الوزن (كجم)",
    "Activity Level": "مستوى النشاط",
    "Diet Quality": "جودة النظام الغذائي",
    "Smoking Status": "حالة التدخين",
    "Existing Conditions (Optional)": "الحالات الحالية (اختياري)",
    "Daily Stress Level": "مستوى الإجهاد اليومي",
    "Sleep Quality": "جودة النوم",
    "Male": "ذكر", "Female": "أنثى", "Other": "أخرى",
    "Sedentary": "خامل", "Light": "خفيف", "Moderate": "معتدل", "Active": "نشيط", "Very Active": "نشيط جداً",
    "Poor": "ضعيف", "Average": "متوسط", "Good": "جيد", "Excellent": "ممتاز",
    "Never": "أبداً", "Former": "سابق", "Current": "حالي",
    "Low": "منخفض", "High": "مرتفع",
    "Update Profile": "تحديث الملف",
    "Log a Meal": "تسجيل وجبة",
    "Analyze & Log Meal": "تحليل الوجبة",
    "Simulate Future Trajectory": "محاكاة المسار المستقبلي",
    "Generate Health Projection": "إنشاء التوقعات الصحية",
    "Your Action Plan": "خطة العمل الخاصة بك",
    "Wellbeing Advisor": "مستشار العافية",
    "Powered by Gemini AI": "مدعوم من Gemini AI",
    "Ask about your health plan...": "اسأل عن خطتك الصحية...",
    "Cancel": "إلغاء", "Yes, Delete": "نعم، احذف",
    "Wipe all data?": "مسح جميع البيانات؟",
    "This deletes your profile, images, and logs forever.": "سيؤدي هذا إلى حذف ملفك الشخصي وصورك وسجلاتك إلى الأبد.",
    "Profile Updated": "تم تحديث الملف الشخصي",
    "My Profile": "ملفي الشخصي",
    "Timeline & Insights": "الجدول الزمني والرؤى",
    "Interactive 3D View": "عرض ثلاثي الأبعاد تفاعلي",
    "Food Tracker": "متتبع الطعام",
    "Logged In": "تم تسجيل الدخول",
    "Force Login": "فرض تسجيل الدخول",
    "Language": "اللغة",
    "Generating...": "جاري التوليد...",
    "Generation Failed": "فشل التوليد",
    "Waiting in queue...": "في انتظار الدور...",
    "Your Baseline Profile": "ملفك الشخصي الأساسي",
    "Visual Impact": "التأثير المرئي",
    "10-Year Visual Impact": "التأثير المرئي لـ 10 سنوات",
    "Take Control of Your Future": "تولَّ السيطرة على مستقبلك",
    "See how optimizing your lifestyle changes your trajectory.": "انظر كيف يغير تحسين نمط حياتك مسارك.",
    "10-Year Visual Impact: Brain & Cognition": "التأثير المرئي لـ 10 سنوات: الدماغ والإدراك",
    "Compare your current trajectory vs. an optimized lifestyle in 10 years.": "قارن مسارك الحالي بمسار نمط الحياة المحسّن خلال 10 سنوات.",
    "Current Path": "المسار الحالي",
    "Optimized Path": "المسار المحسّن",
    "10-Year Visual Impact: Arteries": "التأثير المرئي لـ 10 سنوات: الشرايين",
    "10-Year Visual Impact: External Body": "التأثير المرئي لـ 10 سنوات: الجسم الخارجي",
    "Compare Timeline": "مقارنة الجدول الزمني",
    "Body Mass Index": "مؤشر كتلة الجسم",
    "The model's width and depth scale dynamically based on your simulated BMI trajectory.": "يتوسع عرض النموذج وعمقه ديناميكيًا بناءً على مسار مؤشر كتلة الجسم المحاكى.",
    "Posture & Slouch": "الوضعية والانحناء",
    "Activity levels (like \"Sedentary\") and high cardiovascular risk increase forward slouching.": "تزيد مستويات النشاط (مثل \"الخامل\") والمخاطر العالية لأمراض القلب والأوعية الدموية من الانحناء للأمام.",
    "Skin Tone": "لون البشرة",
    "Overall risk factors (like smoking and poor diet) shift the skin tone from vibrant to pale.": "عوامل الخطر الإجمالية (مثل التدخين وسوء التغذية) تغير لون البشرة من النابض بالحياة إلى الشاحب.",
    "Video Time-Lapse": "فيديو بفاصل زمني",
    "The Future You": "أنت في المستقبل",
    "See a cinematic time-lapse of your face aging over 10 years based on your current lifestyle.": "شاهد عرضاً زمنياً سينمائياً لشيخوخة وجهك على مدار 10 سنوات بناءً على نمط حياتك الحالي.",
    "No profile photo found": "لم يتم العثور على صورة شخصية",
    "Please upload a face photo in your profile to generate a time-lapse video.": "يرجى تحميل صورة للوجه في ملفك الشخصي لإنشاء فيديو بالفاصل الزمني.",
    "Go to Profile": "الذهاب إلى الملف الشخصي",
    "Regenerate Video": "إعادة توليد الفيديو",
    "Synthesizing Time-Lapse...": "جاري تركيب الفيديو الزمني...",
    "We are generating a highly realistic 10-year age progression video. This process can take a few minutes. Please do not close this tab.": "نحن نقوم بإنشاء فيديو تطور عمري واقعي لمدة 10 سنوات. قد تستغرق هذه العملية بضع دقائق. يرجى ألا تغلق هذه النافذة.",
    "Generate Your Time-Lapse": "توليد الفيديو الزمني الخاص بك",
    "Experience a realistic prediction of how your face might change over the next 10 years based on your current habits.": "جرب تنبؤًا واقعيًا لكيفية تغير وجهك على مدار السنوات الـ 10 القادمة بناءً على عاداتك الحالية.",
    "Start Generation": "بدء التوليد",
    "Video generation failed. Please try again.": "فشل توليد الفيديو. يرجى المحاولة مرة أخرى.",
    "An error occurred during video generation.": "حدث خطأ أثناء إنشاء الفيديو."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');

  // Load saved explicitly from localforage if needed, or stick to localStorage for fast sync load
  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && LANGUAGES.includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    return UI_TRANSLATIONS[language]?.[key] || key;
  };

  const dir = language === 'Arabic' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language === 'Arabic' ? 'ar' : 'en';
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
