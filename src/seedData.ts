import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function seedMoroccanInterimData(currentUid: string, currentAlias: string): Promise<void> {
  // 1. Seed sample anonymized candidate profiles in /public_profiles
  const sampleProfiles = [
    {
      id: 'cand_casa_01',
      uid: 'cand_casa_01',
      aliasCode: 'CAND-8412',
      role: 'candidate' as const,
      titleFr: 'Technicien Maintenance Industrielle & Électromécanique',
      titleAr: 'تقني الصيانة الصناعية والإلكتروميكانيك',
      city: 'Casablanca',
      experienceYears: 6,
      availability: 'immediate' as const,
      skills: ['Maintenance Industrielle', 'Électromécanique', 'Qualité ISO 9001', 'Sécurité HSE'],
      bioSummary:
        'Expérience confirmée en maintenance préventive et curative sur lignes automatisées (Zone Industrielle Ain Sebaa & Nouaceur). Habilitation électrique B2V/BR.',
      isPremium: true,
      subscriptionPlan: 'pro_candidate' as const,
      dailyRateMad: 480,
      verified: true,
    },
    {
      id: 'cand_tanger_02',
      uid: 'cand_tanger_02',
      aliasCode: 'CAND-3920',
      role: 'candidate' as const,
      titleFr: 'Chef d’Équipe Logistique Portuaire & Cariste CACES 3',
      titleAr: 'رئيس فريق اللوجستيك المينائي وسائق رافعة شوكية',
      city: 'Tanger',
      experienceYears: 5,
      availability: 'immediate' as const,
      skills: ['Cariste CACES 3', 'Logistique Portuaire', 'Gestion de Stock SAP', 'Sécurité HSE'],
      bioSummary:
        'Spécialiste flux conteneurs et entrepôts sous douane Tanger Med. Maîtrise SAP WM/EWM et conduite d’engins de manutention.',
      isPremium: true,
      subscriptionPlan: 'pro_candidate' as const,
      dailyRateMad: 420,
      verified: true,
    },
    {
      id: 'cand_kenitra_03',
      uid: 'cand_kenitra_03',
      aliasCode: 'CAND-5108',
      role: 'candidate' as const,
      titleFr: 'Soudeur TIG/MIG & Câblage Automobile',
      titleAr: 'لحام صناعي وتقني كابلات السيارات',
      city: 'Kénitra',
      experienceYears: 4,
      availability: 'notice_15d' as const,
      skills: ['Soudure TIG/MIG', 'Câblage Automobile', 'Usinage CNC', 'Qualité ISO 9001'],
      bioSummary:
        'Intervention en Atlantic Free Zone Kénitra sur faisceaux et assemblage châssis. Contrôle qualité norme IATF 16949.',
      isPremium: false,
      subscriptionPlan: 'free' as const,
      dailyRateMad: 360,
      verified: true,
    },
    {
      id: 'cand_rabat_04',
      uid: 'cand_rabat_04',
      aliasCode: 'CAND-7741',
      role: 'candidate' as const,
      titleFr: 'Conducteur de Travaux BTP & Génie Civil',
      titleAr: 'مشرف أشغال البناء والهندسة المدنية',
      city: 'Rabat',
      experienceYears: 8,
      availability: 'immediate' as const,
      skills: ['Génie Civil BTP', 'Sécurité HSE', 'Qualité ISO 9001'],
      bioSummary:
        'Suivi de chantiers d’infrastructures routières et bâtiments tertiaires à Rabat-Salé. Coordination des équipes intérimaires et respect des normes HSE.',
      isPremium: true,
      subscriptionPlan: 'pro_candidate' as const,
      dailyRateMad: 650,
      verified: true,
    },
  ];

  // Note: Only Admins can create public_profiles for other UIDs according to hardened rules,
  // so we always create sample jobs owned by the current authenticated user, and if the user is admin,
  // we also seed the sample profiles and their isolated PII vault records.
  const sampleJobs = [
    {
      id: 'job_tanger_auto_01',
      recruiterId: currentUid,
      recruiterAlias: currentAlias || 'REC-9012',
      titleFr: 'Équipe de 4 Techniciens Maintenance & Automatisme (3x8)',
      titleAr: 'فريق 4 تقنيي صيانة وأتمتة صناعية (نظام التناوب)',
      sector: 'Automobile & Aéronautique',
      city: 'Tanger',
      contractType: 'interim_mission' as const,
      durationWeeks: 16,
      salaryMad: 9500,
      requiredSkills: ['Maintenance Industrielle', 'Électromécanique', 'Câblage Automobile', 'Qualité ISO 9001'],
      descriptionFr:
        'Mission d’intérim urgente en zone franche industrielle de Tanger. Maintenance préventive des robots d’assemblage et diagnostic automate Siemens.',
      descriptionAr:
        'مهمة عمل مؤقتة عاجلة بالمنطقة الصناعية الحرة بطنجة. الصيانة الوقائية لروبوتات التجميع وتشخيص الأعطال الصناعية.',
      isPriority: true,
      status: 'open' as const,
    },
    {
      id: 'job_casa_log_02',
      recruiterId: currentUid,
      recruiterAlias: currentAlias || 'REC-9012',
      titleFr: 'Responsable Quai & Caristes CACES 3 — Plateforme Logistique',
      titleAr: 'مسؤول رصيف الشحن وسائقو رافعات شوكية — الدار البيضاء',
      sector: 'Logistique & Transport',
      city: 'Casablanca',
      contractType: 'pre_embauche' as const,
      durationWeeks: 24,
      salaryMad: 8200,
      requiredSkills: ['Cariste CACES 3', 'Logistique Portuaire', 'Gestion de Stock SAP', 'Sécurité HSE'],
      descriptionFr:
        'Gestion des réceptions/expéditions sur entrepôt de 18 000 m² à Zenata. Maîtrise impérative du terminal RF et SAP.',
      descriptionAr:
        'إدارة عمليات الشحن والتفريغ بمستودع لوجستي بمنطقة زناتة. يشترط إتقان نظام SAP وقواعد السلامة المهنية.',
      isPriority: true,
      status: 'open' as const,
    },
    {
      id: 'job_rabat_btp_03',
      recruiterId: currentUid,
      recruiterAlias: currentAlias || 'REC-9012',
      titleFr: 'Chef de Chantier Gros Œuvre & Coordinateur HSE',
      titleAr: 'رئيس ورش الأشغال الكبرى ومنسق السلامة المهنية',
      sector: 'BTP & Génie Civil',
      city: 'Rabat',
      contractType: 'cdd_interim' as const,
      durationWeeks: 36,
      salaryMad: 12500,
      requiredSkills: ['Génie Civil BTP', 'Sécurité HSE', 'Qualité ISO 9001'],
      descriptionFr:
        'Supervision d’un chantier hospitalier à Rabat. Encadrement de 45 compagnons coffreurs/ferrailleurs et reporting journalier.',
      descriptionAr:
        'الإشراف الميداني على ورش بناء بالرباط. تأطير فرق العمل وضمان احترام معايير الجودة والسلامة.',
      isPriority: false,
      status: 'open' as const,
    },
    {
      id: 'job_kenitra_cnc_04',
      recruiterId: currentUid,
      recruiterAlias: currentAlias || 'REC-9012',
      titleFr: 'Opérateurs Usinage CNC & Soudeurs TIG Certifiés',
      titleAr: 'مشغلو آلات التصنيع الرقمي CNC ولحامون معتمدون',
      sector: 'Industrie & Maintenance',
      city: 'Kénitra',
      contractType: 'interim_mission' as const,
      durationWeeks: 12,
      salaryMad: 7800,
      requiredSkills: ['Usinage CNC', 'Soudure TIG/MIG', 'Câblage Automobile'],
      descriptionFr:
        'Fabrication de pièces de précision en aluminium et acier inoxydable. Lecture de plans ISO et contrôle tridimensionnel.',
      descriptionAr:
        'تصنيع قطع ميكانيكية دقيقة وقراءة التصاميم الهندسية مع مراقبة الجودة الصناعية بالقنيطرة.',
      isPriority: false,
      status: 'open' as const,
    },
  ];

  for (const job of sampleJobs) {
    try {
      await setDoc(doc(db, 'jobs', job.id), {
        recruiterId: job.recruiterId,
        recruiterAlias: job.recruiterAlias,
        titleFr: job.titleFr,
        titleAr: job.titleAr,
        sector: job.sector,
        city: job.city,
        contractType: job.contractType,
        durationWeeks: job.durationWeeks,
        salaryMad: job.salaryMad,
        requiredSkills: job.requiredSkills,
        descriptionFr: job.descriptionFr,
        descriptionAr: job.descriptionAr,
        isPriority: job.isPriority,
        status: job.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jobs/${job.id}`);
    }
  }

  // Try seeding candidate public profiles & PII vault if the current user is the platform administrator
  for (const prof of sampleProfiles) {
    try {
      await setDoc(doc(db, 'public_profiles', prof.id), {
        uid: prof.uid,
        aliasCode: prof.aliasCode,
        role: prof.role,
        titleFr: prof.titleFr,
        titleAr: prof.titleAr,
        city: prof.city,
        experienceYears: prof.experienceYears,
        availability: prof.availability,
        skills: prof.skills,
        bioSummary: prof.bioSummary,
        isPremium: prof.isPremium,
        subscriptionPlan: prof.subscriptionPlan,
        dailyRateMad: prof.dailyRateMad,
        verified: prof.verified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Non-admin users can only write their own profile; ignore silently
    }
  }
}
