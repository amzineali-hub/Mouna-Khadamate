import { jsPDF } from 'jspdf';

interface GuideSection {
  title: string;
  items: string[];
  codeBlock?: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: '1. نظرة عامة على فكرة المنصة وآلية عملها (Business Logic)',
    items: [
      '• صُممت منصة منى تشغيل (Mouna Emploi) كوكالة تشغيل مؤقت (Intérim) ذكية ومؤمنة بنسبة 100% بالمغرب.',
      '• 1. المترشح (Candidat Intérimaire) : ينشئ ملفه المهني، يحدد مهاراته التقنية ومدينته وأجره اليومي بالدرهم، ويترشح لمهام العمل بنقرة واحدة.',
      '• 2. المشغل / الشركة (Recruteur Entreprise) : ينشر عروض العمل المؤقتة، يفلتر الكفاءات حسب المهارات التقنية والمدينة والتفرغ، ويتابع الترشيحات.',
      '• 3. مدير المنصة / الوكالة (Administrateur) : يمتلك الصلاحية الحصرية للوصول إلى خزنة البيانات الشخصية السرية (Coffre-Fort PII) للربط التعاقدي.',
      '• مبدأ السرية (Anti-PII) : يتعامل المترشحون والمشغلون عبر رموز مستعارة فقط (CAND-8412 / REC-9012) دون كشف أرقام الهواتف أو الهوية.',
      '• الفلترة التلقائية في المحادثة (sanitizePublicText) : أي رقم هاتف أو إيميل يُكتب في الدردشة يتم إخفاؤه تلقائياً لحماية عمولة الوكالة.',
    ],
  },
  {
    title: '2. الهيكلة البرمجية والتقنيات المستخدمة (Architecture Technique)',
    items: [
      '• الواجهة الأمامية (Frontend) : React 19 + TypeScript + Vite + Tailwind CSS بتصميم ثلاثي الأبعاد (3D Brown Relief) على خلفية بيضاء (#FFFFFF).',
      '• ثنائية اللغة (Bilingue FR / AR) : دعم فوري للغتين العربية (RTL بخط Cairo) والفرنسية (LTR بخط Plus Jakarta Sans) والرسوم البيانية عبر Recharts.',
      '• الخادم الخلفي (Backend - server.ts) : يعمل بـ Express.js (Node.js) على المنفذ 3000 ويوفر البث الحي للإشعارات الفورية (SSE) على /api/realtime/stream.',
      '• بوابة التحقق من الاشتراكات (/api/billing/checkout) : لتفعيل الباقات الشهرية بالدرهم المغربي (CMI / Visa).',
      '• قاعدة البيانات والمصادقة : Firebase Authentication (Google Sign-In) + Cloud Firestore فورية محمية بقواعد firestore.rules.',
    ],
  },
  {
    title: '3. خارطة ملفات المشروع وكيفية عمل كل ملف',
    items: [
      '• src/i18n.ts : يحتوي على جميع النصوص المترجمة (عربي/فرنسي)، قائمة المدن المغربية (MOROCCAN_CITIES)، المهارات التقنية (MOROCCAN_SKILLS)، والقطاعات (SECTORS)، وجملة استفسار الواتساب.',
      '• src/App.tsx : القلب النابض للمنصة، يحتوي على الشاشات الـ 8، زر الواتساب (+212 687422391)، حساب نسبة التوافق، وإدارة الحالة الفورية مع Firestore.',
      '• src/seedData.ts : يحتوي على البيانات المغربية التجريبية التي تُضخ عند الضغط على زر "تحميل بيانات تجريبية مغربية".',
      '• src/index.css : يحتوي على تصميم الأزرار والبطاقات ثلاثية الأبعاد (.card-3d-brown, .btn-3d-brown, .btn-3d-whatsapp).',
      '• src/firebase.ts : إعداد الاتصال بـ Firebase ودالة فلترة وإخفاء أرقام الهاتف والإيميلات (sanitizePublicText).',
      '• firestore.rules : قواعد الحماية الأمنية لقاعدة بيانات Firestore وعزل خزنة الإدارة.',
    ],
  },
  {
    title: '4. شرح هيكلة قاعدة البيانات (Collections Firestore)',
    items: [
      '• 1. public_profiles/{userId} : الملفات العامة المجهولة (aliasCode, role, titleFr, titleAr, city, skills, dailyRateMad, isPremium).',
      '• 2. user_pii/{userId} : خزنة البيانات السرية المعزولة (fullName, email, phone, cinOrIce, companyLegalName, exactAddress) — للإدارة فقط.',
      '• 3. jobs/{jobId} : عروض ومهام العمل المؤقت (titleFr, titleAr, sector, city, contractType, durationWeeks, salaryMad, requiredSkills).',
      '• 4. applications/{applicationId} : طلبات الترشيح ونسبة التوافق المئوية (matchScore) وحالة الطلب (pending, shortlisted, interview, hired, rejected).',
      '• 5. chats/{threadId} و messages : المحادثات الفورية المجهولة والمؤمنة بين المشغل والمترشح.',
      '• 6. notifications/{notificationId} : سجل الإشعارات الفورية في الوقت الفعلي لكل مستخدم.',
      '• 7. subscriptions/{subscriptionId} : سجل الاشتراكات السنوية (100 درهم / سنة للمترشح، 400 درهم / سنة للمشغل، 800 درهم / سنة للمجموعات الكبرى).',
    ],
  },
  {
    title: '5. طريقة تشغيل المنصة واستخدامها اليومي',
    items: [
      '• التبديل بين العربية والفرنسية : من زر اللغة (العربية / Français) في الشريط الجانبي أو العلوي للهاتف.',
      '• زر التواصل عبر واتساب (212 687422391) : يقع تحت اسم Mouna Emploi · منى تشغيل باللون الأخضر ثلاثي الأبعاد، ويرسل جملة استفسار جاهزة بلغة المستخدم.',
      '• تسجيل الدخول وصلاحية المدير العام (Admin) : عند الدخول بالبريد الإداري (developpementistes@gmail.com) تُفتح تلقائياً خزنة البيانات السرية (PII Vault).',
      '• تهيئة البيانات المغربية : زر "تحميل بيانات تجريبية مغربية" يملأ المنصة فوراً بعروض عمل وملفات كفاءات مغربية.',
    ],
  },
  {
    title: '6. كيفية تحديث المعطيات والبيانات (من الألف إلى الياء)',
    items: [
      '• أولاً — من داخل واجهة المنصة (بدون لمس الكود) :',
      '  1) نشر عرض عمل جديد : من الزر العلوي "نشر عرض عمل جديد" املأ العنوان والمهارات والراتب بالدرهم ليُنشر فوراً في الوقت الفعلي.',
      '  2) تحديث الملف المهني والبيانات السرية : من تبويب "ملفي والخصوصية" عدّل مهاراتك وأجرك اليومي واسمك القانوني ورقم CIN/ICE ثم اضغط حفظ.',
      '  3) تحديث حالة الترشيحات : من تبويب "تتبع الترشيحات" اضغط على أزرار الحالة (مقبول أولياً، مقابلة، تعاقد، مرفوض) مع إرسال إشعار فوري للمترشح.',
      '• ثانياً — من داخل الكود البرمجي :',
      '  1) إضافة مدن أو مهارات أو قطاعات : افتح الملف src/i18n.ts وعدّل مصفوفات MOROCCAN_CITIES أو MOROCCAN_SKILLS أو SECTORS.',
      '  2) تعديل رسالة الواتساب أو الرقم : عدّل whatsappInquiryText في src/i18n.ts، أو الرقم 212687422391 في src/App.tsx.',
      '  3) تغيير البريد الإلكتروني للمدير العام : عدّل BOOTSTRAP_ADMIN_EMAIL في src/App.tsx ودالة isAdmin() في firestore.rules.',
    ],
    codeBlock: [
      'npm install       # تثبيت الحزم البرمجية',
      'npm run dev       # تشغيل خادم التطوير على المنفذ 3000',
      'npm run build     # بناء نسخة الإنتاج النهائية',
      'npm start         # تشغيل خادم الإنتاج',
    ],
  },
];

function wrapArabicText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function generateAndDownloadArabicGuidePdf(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const PAGE_W = 1240; // A4 @ 150 DPI width
  const PAGE_H = 1754; // A4 @ 150 DPI height
  const MARGIN_X = 70;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;

  const pages: HTMLCanvasElement[] = [];

  const createNewPage = (pageNumber: number): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    y: number;
  } => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d')!;

    // Crisp White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Outer 3D Brown Border Frame
    ctx.strokeStyle = '#542B14';
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, PAGE_W - 56, PAGE_H - 56);

    // Footer
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#542B14';
    ctx.font = 'bold 20px "Cairo", sans-serif';
    ctx.fillText(
      `الوثيقة المرجعية الشاملة — منصة منى تشغيل | Mouna Emploi — صفحة ${pageNumber}`,
      PAGE_W / 2,
      PAGE_H - 52
    );

    pages.push(canvas);
    return { canvas, ctx, y: 80 };
  };

  let pageIndex = 1;
  let { ctx, y } = createNewPage(pageIndex);

  // Draw Document Header Banner on Page 1
  ctx.fillStyle = '#542B14';
  ctx.fillRect(MARGIN_X, y, CONTENT_W, 175);
  ctx.fillStyle = '#241005';
  ctx.fillRect(MARGIN_X, y + 175, CONTENT_W, 8);

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FCD34D';
  ctx.font = '900 38px "Cairo", sans-serif';
  ctx.fillText(
    'الدليل الشامل لمنصة منى تشغيل | Mouna Emploi',
    PAGE_W / 2,
    y + 62
  );

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px "Cairo", sans-serif';
  ctx.fillText(
    'دليل التشغيل، البرمجة، الهيكلة التقنية، وتحديث المعطيات من الألف إلى الياء',
    PAGE_W / 2,
    y + 112
  );

  ctx.fillStyle = '#6EE7B7';
  ctx.font = '700 21px "Cairo", sans-serif';
  ctx.fillText(
    'واتساب الوكالة : 212687422391+  |  الإدارة : developpementistes@gmail.com',
    PAGE_W / 2,
    y + 152
  );

  y += 215;

  for (const section of GUIDE_SECTIONS) {
    if (y > PAGE_H - 260) {
      pageIndex += 1;
      const next = createNewPage(pageIndex);
      ctx = next.ctx;
      y = next.y;
    }

    // Section Header Bar (3D Brown style)
    ctx.fillStyle = '#542B14';
    ctx.fillRect(MARGIN_X, y, CONTENT_W, 56);
    ctx.fillStyle = '#241005';
    ctx.fillRect(MARGIN_X, y + 56, CONTENT_W, 5);

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 26px "Cairo", sans-serif';
    ctx.fillText(section.title, PAGE_W - MARGIN_X - 20, y + 38);

    y += 84;

    // Section Bullet Items
    for (const item of section.items) {
      ctx.font = '600 22px "Cairo", sans-serif';
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      const lines = wrapArabicText(ctx, item, CONTENT_W - 36);

      if (y + lines.length * 38 > PAGE_H - 120) {
        pageIndex += 1;
        const next = createNewPage(pageIndex);
        ctx = next.ctx;
        y = next.y;
      }

      ctx.fillStyle = '#2A1408';
      ctx.font = '600 22px "Cairo", sans-serif';
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';

      for (const line of lines) {
        ctx.fillText(line, PAGE_W - MARGIN_X - 16, y);
        y += 38;
      }
      y += 8;
    }

    if (section.codeBlock && section.codeBlock.length > 0) {
      const boxHeight = section.codeBlock.length * 36 + 32;
      if (y + boxHeight > PAGE_H - 120) {
        pageIndex += 1;
        const next = createNewPage(pageIndex);
        ctx = next.ctx;
        y = next.y;
      }

      ctx.fillStyle = '#2A1408';
      ctx.fillRect(MARGIN_X, y, CONTENT_W, boxHeight);
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FCD34D';
      ctx.font = '600 20px "IBM Plex Mono", monospace';

      let codeY = y + 34;
      for (const cmd of section.codeBlock) {
        ctx.fillText(cmd, MARGIN_X + 24, codeY);
        codeY += 36;
      }
      y += boxHeight + 24;
    } else {
      y += 16;
    }
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pages.forEach((canvasPage, idx) => {
    if (idx > 0) {
      pdf.addPage();
    }
    const imgData = canvasPage.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });

  pdf.save('Guide-Complet-Mouna-Emploi-AR.pdf');
}
