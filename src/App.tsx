import React, { useEffect, useMemo, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Briefcase,
  Users,
  MessageSquare,
  Bell,
  Shield,
  CreditCard,
  Search,
  Plus,
  Send,
  Check,
  X,
  Lock,
  Globe,
  LogOut,
  Filter,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  sanitizePublicText,
} from './firebase';
import {
  Language,
  MOROCCAN_CITIES,
  MOROCCAN_SKILLS,
  SECTORS,
  translations,
} from './i18n';
import {
  PublicProfile,
  UserPII,
  JobOffer,
  Application,
  ChatThread,
  ChatMessage,
  SubscriptionRecord,
  PushNotification,
} from './types';
import { seedMoroccanInterimData } from './seedData';

type ActiveTab =
  | 'dashboard'
  | 'jobs'
  | 'candidates'
  | 'applications'
  | 'chat'
  | 'pricing'
  | 'profile'
  | 'admin_vault';

const BOOTSTRAP_ADMIN_EMAIL = 'developpementistes@gmail.com';

const PREVIEW_JOBS: JobOffer[] = [
  {
    id: 'preview_tanger_01',
    recruiterId: 'demo_rec_01',
    recruiterAlias: 'REC-9012',
    titleFr: 'Équipe de 4 Techniciens Maintenance & Automatisme (3x8)',
    titleAr: 'فريق 4 تقنيي صيانة وأتمتة صناعية (نظام التناوب)',
    sector: 'Automobile & Aéronautique',
    city: 'Tanger',
    contractType: 'interim_mission',
    durationWeeks: 16,
    salaryMad: 9500,
    requiredSkills: ['Maintenance Industrielle', 'Électromécanique', 'Câblage Automobile', 'Qualité ISO 9001'],
    descriptionFr:
      'Mission d’intérim urgente en zone franche industrielle de Tanger. Maintenance préventive des robots d’assemblage et diagnostic automate Siemens.',
    descriptionAr:
      'مهمة عمل مؤقتة عاجلة بالمنطقة الصناعية الحرة بطنجة. الصيانة الوقائية لروبوتات التجميع وتشخيص الأعطال الصناعية.',
    isPriority: true,
    status: 'open',
  },
  {
    id: 'preview_casa_02',
    recruiterId: 'demo_rec_02',
    recruiterAlias: 'REC-4180',
    titleFr: 'Responsable Quai & Caristes CACES 3 — Plateforme Logistique',
    titleAr: 'مسؤول رصيف الشحن وسائقو رافعات شوكية — الدار البيضاء',
    sector: 'Logistique & Transport',
    city: 'Casablanca',
    contractType: 'pre_embauche',
    durationWeeks: 24,
    salaryMad: 8200,
    requiredSkills: ['Cariste CACES 3', 'Logistique Portuaire', 'Gestion de Stock SAP', 'Sécurité HSE'],
    descriptionFr:
      'Gestion des réceptions/expéditions sur entrepôt de 18 000 m² à Zenata. Maîtrise impérative du terminal RF et SAP.',
    descriptionAr:
      'إدارة عمليات الشحن والتفريغ بمستودع لوجستي بمنطقة زناتة. يشترط إتقان نظام SAP وقواعد السلامة المهنية.',
    isPriority: true,
    status: 'open',
  },
  {
    id: 'preview_rabat_03',
    recruiterId: 'demo_rec_03',
    recruiterAlias: 'REC-7304',
    titleFr: 'Chef de Chantier Gros Œuvre & Coordinateur HSE',
    titleAr: 'رئيس ورش الأشغال الكبرى ومنسق السلامة المهنية',
    sector: 'BTP & Génie Civil',
    city: 'Rabat',
    contractType: 'cdd_interim',
    durationWeeks: 36,
    salaryMad: 12500,
    requiredSkills: ['Génie Civil BTP', 'Sécurité HSE', 'Qualité ISO 9001'],
    descriptionFr:
      'Supervision d’un chantier hospitalier à Rabat. Encadrement de 45 compagnons coffreurs/ferrailleurs et reporting journalier.',
    descriptionAr:
      'الإشراف الميداني على ورش بناء بالرباط. تأطير فرق العمل وضمان احترام معايير الجودة والسلامة.',
    isPriority: false,
    status: 'open',
  },
  {
    id: 'preview_kenitra_04',
    recruiterId: 'demo_rec_04',
    recruiterAlias: 'REC-5529',
    titleFr: 'Opérateurs Usinage CNC & Soudeurs TIG Certifiés',
    titleAr: 'مشغلو آلات التصنيع الرقمي CNC ولحامون معتمدون',
    sector: 'Industrie & Maintenance',
    city: 'Kénitra',
    contractType: 'interim_mission',
    durationWeeks: 12,
    salaryMad: 7800,
    requiredSkills: ['Usinage CNC', 'Soudure TIG/MIG', 'Câblage Automobile'],
    descriptionFr:
      'Fabrication de pièces de précision en aluminium et acier inoxydable. Lecture de plans ISO et contrôle tridimensionnel.',
    descriptionAr:
      'تصنيع قطع ميكانيكية دقيقة وقراءة التصاميم الهندسية مع مراقبة الجودة الصناعية بالقنيطرة.',
    isPriority: false,
    status: 'open',
  },
];

const PREVIEW_PROFILES: PublicProfile[] = [
  {
    id: 'preview_cand_01',
    uid: 'preview_cand_01',
    aliasCode: 'CAND-8412',
    role: 'candidate',
    titleFr: 'Technicien Maintenance Industrielle & Électromécanique',
    titleAr: 'تقني الصيانة الصناعية والإلكتروميكانيك',
    city: 'Casablanca',
    experienceYears: 6,
    availability: 'immediate',
    skills: ['Maintenance Industrielle', 'Électromécanique', 'Qualité ISO 9001', 'Sécurité HSE'],
    bioSummary:
      'Expérience confirmée en maintenance préventive et curative sur lignes automatisées (Zone Industrielle Ain Sebaa & Nouaceur).',
    isPremium: true,
    subscriptionPlan: 'pro_candidate',
    dailyRateMad: 480,
    verified: true,
  },
  {
    id: 'preview_cand_02',
    uid: 'preview_cand_02',
    aliasCode: 'CAND-3920',
    role: 'candidate',
    titleFr: 'Chef d’Équipe Logistique Portuaire & Cariste CACES 3',
    titleAr: 'رئيس فريق اللوجستيك المينائي وسائق رافعة شوكية',
    city: 'Tanger',
    experienceYears: 5,
    availability: 'immediate',
    skills: ['Cariste CACES 3', 'Logistique Portuaire', 'Gestion de Stock SAP', 'Sécurité HSE'],
    bioSummary:
      'Spécialiste flux conteneurs et entrepôts sous douane Tanger Med. Maîtrise SAP WM/EWM et conduite d’engins.',
    isPremium: true,
    subscriptionPlan: 'pro_candidate',
    dailyRateMad: 420,
    verified: true,
  },
  {
    id: 'preview_cand_03',
    uid: 'preview_cand_03',
    aliasCode: 'CAND-5108',
    role: 'candidate',
    titleFr: 'Soudeur TIG/MIG & Câblage Automobile',
    titleAr: 'لحام صناعي وتقني كابلات السيارات',
    city: 'Kénitra',
    experienceYears: 4,
    availability: 'notice_15d',
    skills: ['Soudure TIG/MIG', 'Câblage Automobile', 'Usinage CNC', 'Qualité ISO 9001'],
    bioSummary:
      'Intervention en Atlantic Free Zone Kénitra sur faisceaux et assemblage châssis. Contrôle qualité norme IATF 16949.',
    isPremium: false,
    subscriptionPlan: 'free',
    dailyRateMad: 360,
    verified: true,
  },
  {
    id: 'preview_cand_04',
    uid: 'preview_cand_04',
    aliasCode: 'CAND-7741',
    role: 'candidate',
    titleFr: 'Conducteur de Travaux BTP & Génie Civil',
    titleAr: 'مشرف أشغال البناء والهندسة المدنية',
    city: 'Rabat',
    experienceYears: 8,
    availability: 'immediate',
    skills: ['Génie Civil BTP', 'Sécurité HSE', 'Qualité ISO 9001'],
    bioSummary:
      'Suivi de chantiers d’infrastructures routières et bâtiments tertiaires à Rabat-Salé. Coordination des équipes intérimaires.',
    isPremium: true,
    subscriptionPlan: 'pro_candidate',
    dailyRateMad: 650,
    verified: true,
  },
];

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Firestore Real-Time State
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [, setMyPII] = useState<UserPII | null>(null);
  const [allProfiles, setAllProfiles] = useState<PublicProfile[]>([]);
  const [allPIIVault, setAllPIIVault] = useState<UserPII[]>([]);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);

  // Real-time Server-Sent Events (SSE) Push Banner & Presence
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [livePushToast, setLivePushToast] = useState<{
    titleFr: string;
    titleAr: string;
    timestamp: string;
  } | null>(null);
  const [showNotifDrawer, setShowNotifDrawer] = useState<boolean>(false);

  // Intelligent Skill Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [priorityOnly, setPriorityOnly] = useState<boolean>(false);

  // Modals & Forms State
  const [showCreateJobModal, setShowCreateJobModal] = useState<boolean>(false);
  const [newJobForm, setNewJobForm] = useState({
    titleFr: '',
    titleAr: '',
    sector: SECTORS[0],
    city: MOROCCAN_CITIES[0],
    contractType: 'interim_mission' as 'interim_mission' | 'cdd_interim' | 'pre_embauche',
    durationWeeks: 12,
    salaryMad: 8500,
    requiredSkills: ['Maintenance Industrielle', 'Qualité ISO 9001'] as string[],
    descriptionFr: '',
    descriptionAr: '',
    isPriority: true,
  });

  // Profile & PII Editor Form State
  const [profileForm, setProfileForm] = useState({
    role: 'candidate' as 'candidate' | 'recruiter' | 'admin',
    titleFr: 'Technicien Supérieur Électromécanique & HSE',
    titleAr: 'تقني عالي في الإلكتروميكانيك والسلامة المهنية',
    city: 'Casablanca',
    experienceYears: 5,
    availability: 'immediate' as 'immediate' | 'notice_15d' | 'on_mission',
    skills: ['Maintenance Industrielle', 'Électromécanique', 'Qualité ISO 9001', 'Sécurité HSE'],
    bioSummary:
      'Profil intérimaire qualifié disponible immédiatement pour missions industrielles ou logistiques au Maroc.',
    dailyRateMad: 450,
    fullName: '',
    email: '',
    phone: '+212 6 00 00 00 00',
    cinOrIce: 'BK123456',
    companyLegalName: 'N/A',
    exactAddress: 'Boulevard Zerktouni, Casablanca',
  });
  const [profileSaveFeedback, setProfileSaveFeedback] = useState<string | null>(null);

  // Chat Input State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatRedactedNotice, setChatRedactedNotice] = useState<boolean>(false);

  // Checkout Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<{
    id: 'pro_candidate' | 'pro_recruiter' | 'enterprise';
    name: string;
    priceMad: number;
  } | null>(null);
  const [cardForm, setCardForm] = useState({
    cardNumber: '4532 8910 4421 8842',
    expiry: '08/28',
    cvc: '842',
  });
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  const isUserAdmin = Boolean(
    user?.email === BOOTSTRAP_ADMIN_EMAIL || myProfile?.role === 'admin'
  );

  // Sync RTL/LTR direction on document root
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [isRtl, lang]);

  // Connect to Node.js SSE stream for real-time push alerts & presence
  useEffect(() => {
    const evtSource = new EventSource('/api/realtime/stream');
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init' && data.state) {
          setOnlineCount(data.state.onlineCount || 1);
        } else if (data.type === 'presence') {
          setOnlineCount(data.onlineCount || 1);
        } else if (data.type === 'push_event' && data.event) {
          setLivePushToast(data.event);
          setTimeout(() => {
            setLivePushToast((prev) =>
              prev?.timestamp === data.event.timestamp ? null : prev
            );
          }, 6000);
        }
      } catch {
        // Ignore malformed SSE frame
      }
    };
    return () => {
      evtSource.close();
    };
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Auto-bootstrap or listen to user's PublicProfile & isolated UserPII when signed in
  useEffect(() => {
    if (!authReady || !user) {
      setMyProfile(null);
      setMyPII(null);
      return;
    }

    const profileRef = doc(db, 'public_profiles', user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      async (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...(snap.data() as Omit<PublicProfile, 'id'>) };
          setMyProfile(data);
          setProfileForm((prev) => ({
            ...prev,
            role: data.role,
            titleFr: data.titleFr,
            titleAr: data.titleAr,
            city: data.city,
            experienceYears: data.experienceYears,
            availability: data.availability,
            skills: data.skills,
            bioSummary: data.bioSummary,
            dailyRateMad: data.dailyRateMad,
          }));
        } else {
          const codeDigits = user.uid.slice(0, 4).toUpperCase();
          const defaultRole: 'candidate' | 'recruiter' | 'admin' =
            user.email === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : 'candidate';
          const aliasCode =
            defaultRole === 'admin'
              ? `ADM-${codeDigits}`
              : `CAND-${codeDigits}`;

          try {
            await setDoc(profileRef, {
              uid: user.uid,
              aliasCode,
              role: defaultRole,
              titleFr: 'Spécialiste Intérim & Opérations Industrielles',
              titleAr: 'أخصائي التشغيل المؤقت والعمليات الصناعية',
              city: 'Casablanca',
              experienceYears: 5,
              availability: 'immediate',
              skills: ['Maintenance Industrielle', 'Qualité ISO 9001', 'Sécurité HSE', 'Logistique Portuaire'],
              bioSummary:
                'Profil vérifié sur Mouna Emploi. Coordonnées personnelles protégées dans le coffre-fort administratif.',
              isPremium: false,
              subscriptionPlan: 'free',
              dailyRateMad: 450,
              verified: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `public_profiles/${user.uid}`);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `public_profiles/${user.uid}`)
    );

    const piiRef = doc(db, 'user_pii', user.uid);
    const unsubPII = onSnapshot(
      piiRef,
      async (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...(snap.data() as Omit<UserPII, 'id'>) };
          setMyPII(data);
          setProfileForm((prev) => ({
            ...prev,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            cinOrIce: data.cinOrIce,
            companyLegalName: data.companyLegalName,
            exactAddress: data.exactAddress,
          }));
        } else {
          try {
            await setDoc(piiRef, {
              uid: user.uid,
              fullName: (user.displayName || 'Utilisateur Mouna Emploi').slice(0, 100),
              email: (user.email || 'contact@mouna-emploi.ma').slice(0, 120),
              phone: '+212 6 61 00 00 00',
              cinOrIce: 'BK849201',
              companyLegalName: 'Confidentiel',
              exactAddress: 'Casablanca, Maroc',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `user_pii/${user.uid}`);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `user_pii/${user.uid}`)
    );

    return () => {
      unsubProfile();
      unsubPII();
    };
  }, [authReady, user]);

  // Real-time Listeners for Collections
  useEffect(() => {
    if (!authReady || !user) {
      setAllProfiles([]);
      setJobs([]);
      setApplications([]);
      setChatThreads([]);
      setNotifications([]);
      setSubscriptions([]);
      setAllPIIVault([]);
      return;
    }

    const profilesQuery = query(
      collection(db, 'public_profiles'),
      where('role', 'in', ['candidate', 'recruiter', 'admin'])
    );
    const unsubProfiles = onSnapshot(
      profilesQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PublicProfile, 'id'>),
        }));
        setAllProfiles(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'public_profiles')
    );

    const jobsQuery = query(
      collection(db, 'jobs'),
      where('status', 'in', ['open', 'filled', 'closed'])
    );
    const unsubJobs = onSnapshot(
      jobsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<JobOffer, 'id'>),
        }));
        setJobs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')
    );

    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );
    const unsubNotifs = onSnapshot(
      notifQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PushNotification, 'id'>),
        }));
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    const subQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid)
    );
    const unsubSubs = onSnapshot(
      subQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SubscriptionRecord, 'id'>),
        }));
        setSubscriptions(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions')
    );

    const candAppsQuery = query(
      collection(db, 'applications'),
      where('candidateId', '==', user.uid)
    );
    const recAppsQuery = query(
      collection(db, 'applications'),
      where('recruiterId', '==', user.uid)
    );

    let candApps: Application[] = [];
    let recApps: Application[] = [];
    const mergeApps = () => {
      const map = new Map<string, Application>();
      [...candApps, ...recApps].forEach((a) => map.set(a.id, a));
      setApplications(Array.from(map.values()));
    };

    const unsubCandApps = onSnapshot(
      candAppsQuery,
      (snap) => {
        candApps = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Application, 'id'>),
        }));
        mergeApps();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );

    const unsubRecApps = onSnapshot(
      recAppsQuery,
      (snap) => {
        recApps = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Application, 'id'>),
        }));
        mergeApps();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );

    const candChatsQuery = query(
      collection(db, 'chats'),
      where('candidateId', '==', user.uid)
    );
    const recChatsQuery = query(
      collection(db, 'chats'),
      where('recruiterId', '==', user.uid)
    );

    let candChats: ChatThread[] = [];
    let recChats: ChatThread[] = [];
    const mergeChats = () => {
      const map = new Map<string, ChatThread>();
      [...candChats, ...recChats].forEach((c) => map.set(c.id, c));
      const combined = Array.from(map.values());
      setChatThreads(combined);
      if (combined.length > 0 && !activeThreadId) {
        setActiveThreadId(combined[0].id);
      }
    };

    const unsubCandChats = onSnapshot(
      candChatsQuery,
      (snap) => {
        candChats = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatThread, 'id'>),
        }));
        mergeChats();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'chats')
    );

    const unsubRecChats = onSnapshot(
      recChatsQuery,
      (snap) => {
        recChats = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatThread, 'id'>),
        }));
        mergeChats();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'chats')
    );

    return () => {
      unsubProfiles();
      unsubJobs();
      unsubNotifs();
      unsubSubs();
      unsubCandApps();
      unsubRecApps();
      unsubCandChats();
      unsubRecChats();
    };
  }, [authReady, user]);

  // Admin-Only Listener for the PII Vault (/user_pii)
  useEffect(() => {
    if (!authReady || !user || !isUserAdmin) {
      setAllPIIVault([]);
      return;
    }

    const unsubVault = onSnapshot(
      collection(db, 'user_pii'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserPII, 'id'>),
        }));
        setAllPIIVault(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'user_pii')
    );

    return () => unsubVault();
  }, [authReady, user, isUserAdmin]);

  // Listen to Messages inside the currently selected ChatThread
  useEffect(() => {
    if (!authReady || !user || !activeThreadId) {
      setThreadMessages([]);
      return;
    }

    const msgQuery = query(
      collection(db, 'chats', activeThreadId, 'messages'),
      where('threadId', '==', activeThreadId)
    );
    const unsubMsgs = onSnapshot(
      msgQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatMessage, 'id'>),
        }));
        setThreadMessages(list);
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `chats/${activeThreadId}/messages`
        )
    );

    return () => unsubMsgs();
  }, [authReady, user, activeThreadId]);

  const displayJobs = jobs.length > 0 ? jobs : PREVIEW_JOBS;
  const displayProfiles =
    allProfiles.filter((p) => p.role === 'candidate').length > 0
      ? allProfiles.filter((p) => p.role === 'candidate')
      : PREVIEW_PROFILES;

  const computeSkillMatch = (jobSkills: string[], candidateSkills: string[]): number => {
    if (!jobSkills || jobSkills.length === 0) return 100;
    const candSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
    const matched = jobSkills.filter((s) => candSet.has(s.toLowerCase())).length;
    return Math.round((matched / jobSkills.length) * 100);
  };

  const userCandidateSkills = myProfile?.skills || [
    'Maintenance Industrielle',
    'Qualité ISO 9001',
    'Sécurité HSE',
  ];

  const filteredJobs = useMemo(() => {
    return displayJobs
      .filter((job) => {
        if (selectedCity !== 'all' && job.city !== selectedCity) return false;
        if (priorityOnly && !job.isPriority) return false;
        if (
          selectedSkills.length > 0 &&
          !selectedSkills.every((sk) => job.requiredSkills.includes(sk))
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText =
            job.titleFr.toLowerCase().includes(q) ||
            job.titleAr.toLowerCase().includes(q) ||
            job.sector.toLowerCase().includes(q) ||
            job.recruiterAlias.toLowerCase().includes(q) ||
            job.city.toLowerCase().includes(q);
          if (!matchText) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        return (
          computeSkillMatch(b.requiredSkills, userCandidateSkills) -
          computeSkillMatch(a.requiredSkills, userCandidateSkills)
        );
      });
  }, [displayJobs, selectedCity, priorityOnly, selectedSkills, searchQuery, userCandidateSkills]);

  const filteredCandidates = useMemo(() => {
    return displayProfiles
      .filter((cand) => {
        if (selectedCity !== 'all' && cand.city !== selectedCity) return false;
        if (selectedAvailability !== 'all' && cand.availability !== selectedAvailability)
          return false;
        if (priorityOnly && !cand.isPremium) return false;
        if (
          selectedSkills.length > 0 &&
          !selectedSkills.every((sk) => cand.skills.includes(sk))
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchText =
            cand.titleFr.toLowerCase().includes(q) ||
            cand.titleAr.toLowerCase().includes(q) ||
            cand.aliasCode.toLowerCase().includes(q) ||
            cand.city.toLowerCase().includes(q);
          if (!matchText) return false;
        }
        return true;
      })
      .sort((a, b) => (a.isPremium === b.isPremium ? 0 : a.isPremium ? -1 : 1));
  }, [displayProfiles, selectedCity, selectedAvailability, priorityOnly, selectedSkills, searchQuery]);

  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const triggerRealtimePush = async (
    recipientId: string,
    category: 'match' | 'application' | 'message' | 'subscription',
    titleFr: string,
    titleAr: string,
    bodyFr: string,
    bodyAr: string
  ) => {
    try {
      await fetch('/api/realtime/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: category, titleFr, titleAr }),
      });
    } catch {
      // Ignore network error
    }

    if (user && recipientId && !recipientId.startsWith('demo_') && !recipientId.startsWith('preview_')) {
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId,
          senderId: user.uid,
          titleFr: titleFr.slice(0, 100),
          titleAr: titleAr.slice(0, 100),
          bodyFr: bodyFr.slice(0, 250),
          bodyAr: bodyAr.slice(0, 250),
          category,
          read: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Ignore if recipient not yet created
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !myProfile) {
      await handleSignIn();
      return;
    }

    const cleanDescFr = sanitizePublicText(
      newJobForm.descriptionFr ||
        'Mission d’intérim qualifiée avec accompagnement agence Mouna Emploi.'
    ).sanitized;
    const cleanDescAr = sanitizePublicText(
      newJobForm.descriptionAr ||
        'مهمة عمل مؤقتة مؤهلة مع مواكبة كاملة من وكالة منى تشغيل.'
    ).sanitized;

    try {
      await addDoc(collection(db, 'jobs'), {
        recruiterId: user.uid,
        recruiterAlias: myProfile.aliasCode,
        titleFr: newJobForm.titleFr.trim().slice(0, 120),
        titleAr: (newJobForm.titleAr.trim() || newJobForm.titleFr.trim()).slice(0, 120),
        sector: newJobForm.sector,
        city: newJobForm.city,
        contractType: newJobForm.contractType,
        durationWeeks: Number(newJobForm.durationWeeks) || 12,
        salaryMad: Number(newJobForm.salaryMad) || 8000,
        requiredSkills: newJobForm.requiredSkills.slice(0, 15),
        descriptionFr: cleanDescFr,
        descriptionAr: cleanDescAr,
        isPriority: Boolean(newJobForm.isPriority),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setShowCreateJobModal(false);
      await triggerRealtimePush(
        user.uid,
        'match',
        `Nouvelle mission publiée : ${newJobForm.titleFr}`,
        `تم نشر عرض عمل جديد : ${newJobForm.titleAr || newJobForm.titleFr}`,
        `Offre active sur ${newJobForm.city} (${newJobForm.salaryMad} MAD/mois)`,
        `عرض نشط بمدينة ${newJobForm.city} (${newJobForm.salaryMad} درهم/شهر)`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'jobs');
    }
  };

  const handleApplyToJob = async (job: JobOffer) => {
    if (!user || !myProfile) {
      await handleSignIn();
      return;
    }

    let targetJobId = job.id;
    let targetRecruiterId = job.recruiterId;

    if (job.id.startsWith('preview_')) {
      try {
        const createdJobRef = await addDoc(collection(db, 'jobs'), {
          recruiterId: user.uid,
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
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        targetJobId = createdJobRef.id;
        targetRecruiterId = user.uid;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'jobs');
      }
    }

    const matchScore = computeSkillMatch(job.requiredSkills, myProfile.skills);

    try {
      await addDoc(collection(db, 'applications'), {
        jobId: targetJobId,
        jobTitleFr: job.titleFr,
        jobTitleAr: job.titleAr,
        candidateId: user.uid,
        candidateAlias: myProfile.aliasCode,
        recruiterId: targetRecruiterId,
        recruiterAlias: job.recruiterAlias,
        matchScore,
        isPriority: myProfile.isPremium,
        status: 'pending',
        coverNote:
          'Candidature transmise via le système de matching Mouna Emploi. Coordonnées protégées.',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const threadRef = await addDoc(collection(db, 'chats'), {
        jobId: targetJobId,
        jobTitleFr: job.titleFr,
        candidateId: user.uid,
        candidateAlias: myProfile.aliasCode,
        recruiterId: targetRecruiterId,
        recruiterAlias: job.recruiterAlias,
        lastMessagePreview: `Candidature envoyée (${matchScore}% de compatibilité)`,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'chats', threadRef.id, 'messages'), {
        threadId: threadRef.id,
        senderId: user.uid,
        senderAlias: myProfile.aliasCode,
        content: `Bonjour ${job.recruiterAlias}, je postule à la mission "${job.titleFr}" avec un score de compatibilité de ${matchScore}%.`,
        redactedFlag: false,
        createdAt: serverTimestamp(),
      });

      setActiveThreadId(threadRef.id);
      await triggerRealtimePush(
        targetRecruiterId,
        'application',
        `Nouvelle candidature (${matchScore}%) — ${myProfile.aliasCode}`,
        `ترشيح جديد (${matchScore}%) — ${myProfile.aliasCode}`,
        `Mission : ${job.titleFr}`,
        `المهمة : ${job.titleAr}`
      );
      setActiveTab('applications');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'applications');
    }
  };

  const handleUpdateApplicationStatus = async (
    appItem: Application,
    newStatus: 'shortlisted' | 'interview' | 'hired' | 'rejected'
  ) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'applications', appItem.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await triggerRealtimePush(
        appItem.candidateId,
        'application',
        `Statut de candidature mis à jour : ${newStatus.toUpperCase()}`,
        `تم تحديث حالة ترشيحكم : ${newStatus.toUpperCase()}`,
        `Mission : ${appItem.jobTitleFr}`,
        `المهمة : ${appItem.jobTitleAr}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${appItem.id}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !myProfile || !activeThreadId || !chatInput.trim()) return;

    const { sanitized, redacted } = sanitizePublicText(chatInput.trim());
    setChatRedactedNotice(redacted);

    try {
      await addDoc(collection(db, 'chats', activeThreadId, 'messages'), {
        threadId: activeThreadId,
        senderId: user.uid,
        senderAlias: myProfile.aliasCode,
        content: sanitized,
        redactedFlag: redacted,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', activeThreadId), {
        lastMessagePreview: sanitized.slice(0, 180),
        updatedAt: serverTimestamp(),
      });

      const currentThread = chatThreads.find((tItem) => tItem.id === activeThreadId);
      if (currentThread) {
        const recipientUid =
          currentThread.candidateId === user.uid
            ? currentThread.recruiterId
            : currentThread.candidateId;
        await triggerRealtimePush(
          recipientUid,
          'message',
          `Nouveau message de ${myProfile.aliasCode}`,
          `رسالة جديدة من ${myProfile.aliasCode}`,
          sanitized.slice(0, 120),
          sanitized.slice(0, 120)
        );
      }

      setChatInput('');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `chats/${activeThreadId}/messages`
      );
    }
  };

  const handleSaveProfileAndPII = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !myProfile) return;

    const cleanBio = sanitizePublicText(profileForm.bioSummary).sanitized;

    try {
      await updateDoc(doc(db, 'public_profiles', user.uid), {
        titleFr: profileForm.titleFr.trim().slice(0, 120),
        titleAr: profileForm.titleAr.trim().slice(0, 120),
        city: profileForm.city,
        experienceYears: Number(profileForm.experienceYears) || 1,
        availability: profileForm.availability,
        skills: profileForm.skills.slice(0, 15),
        bioSummary: cleanBio,
        dailyRateMad: Number(profileForm.dailyRateMad) || 350,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'user_pii', user.uid), {
        fullName: profileForm.fullName.trim().slice(0, 100) || 'Utilisateur',
        email: profileForm.email.trim().slice(0, 120) || user.email || 'contact@mouna.ma',
        phone: profileForm.phone.trim().slice(0, 30) || '+212 6 00 00 00 00',
        cinOrIce: profileForm.cinOrIce.trim().slice(0, 40) || 'BK000000',
        companyLegalName: profileForm.companyLegalName.trim().slice(0, 120) || 'N/A',
        exactAddress: profileForm.exactAddress.trim().slice(0, 250) || 'Casablanca',
        updatedAt: serverTimestamp(),
      });

      setProfileSaveFeedback(
        lang === 'fr'
          ? 'Profil anonymisé et coffre-fort PII mis à jour avec succès.'
          : 'تم تحديث الملف المجهول وخزنة البيانات الشخصية بنجاح.'
      );
      setTimeout(() => setProfileSaveFeedback(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `public_profiles/${user.uid}`);
    }
  };

  const handleProcessSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    if (!user || !myProfile) {
      await handleSignIn();
      return;
    }

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          cardNumber: cardForm.cardNumber,
          expiry: cardForm.expiry,
          cvc: cardForm.cvc,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.verified) {
        setCheckoutStatus(data.error || 'Erreur de validation bancaire');
        return;
      }

      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        userAlias: myProfile.aliasCode,
        planId: checkoutPlan.id,
        amountMad: checkoutPlan.priceMad,
        billingCycle: 'monthly',
        status: 'active',
        paymentMethodLast4: data.paymentMethodLast4,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'public_profiles', user.uid), {
        isPremium: true,
        subscriptionPlan: checkoutPlan.id,
        updatedAt: serverTimestamp(),
      });

      await triggerRealtimePush(
        user.uid,
        'subscription',
        `Abonnement ${checkoutPlan.name} activé`,
        `تم تفعيل اشتراك ${checkoutPlan.name}`,
        `Mise en relation prioritaire active (${checkoutPlan.priceMad} MAD/mois)`,
        `أولوية الربط المهني مفعلة (${checkoutPlan.priceMad} درهم/شهر)`
      );

      setCheckoutStatus(
        lang === 'fr'
          ? `Paiement confirmé (${data.transactionRef}) — Abonnement mensuel actif !`
          : `تم تأكيد الدفع (${data.transactionRef}) — اشتراككم الشهري نشط!`
      );
      setTimeout(() => {
        setCheckoutPlan(null);
        setCheckoutStatus(null);
      }, 2200);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'subscriptions');
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
    }
  };

  const dailyActivityData = useMemo(
    () => [
      { day: lang === 'fr' ? 'Lun' : 'الإثنين', missions: 14, candidatures: 42, placements: 8 },
      { day: lang === 'fr' ? 'Mar' : 'الثلاثاء', missions: 19, candidatures: 58, placements: 11 },
      { day: lang === 'fr' ? 'Mer' : 'الأربعاء', missions: 24, candidatures: 74, placements: 15 },
      { day: lang === 'fr' ? 'Jeu' : 'الخميس', missions: 21, candidatures: 67, placements: 14 },
      { day: lang === 'fr' ? 'Ven' : 'الجمعة', missions: 29, candidatures: 91, placements: 19 },
      {
        day: lang === 'fr' ? 'Sam' : 'السبت',
        missions: 16 + jobs.length,
        candidatures: 52 + applications.length * 4,
        placements: 12 + applications.filter((a) => a.status === 'hired').length,
      },
    ],
    [lang, jobs.length, applications]
  );

  const sectorAnalyticsData = useMemo(
    () => [
      { sector: 'Automobile', count: 38 + jobs.filter((j) => j.sector.includes('Auto')).length },
      { sector: 'Logistique', count: 31 + jobs.filter((j) => j.sector.includes('Logistique')).length },
      { sector: 'BTP & Génie', count: 27 + jobs.filter((j) => j.sector.includes('BTP')).length },
      { sector: 'Industrie', count: 24 + jobs.filter((j) => j.sector.includes('Industrie')).length },
      { sector: 'IT & Digital', count: 16 + jobs.filter((j) => j.sector.includes('IT')).length },
    ],
    [jobs]
  );

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard' as const, label: t.navDashboard, icon: TrendingUp },
    { id: 'jobs' as const, label: t.navJobs, icon: Briefcase },
    { id: 'candidates' as const, label: t.navCandidates, icon: Users },
    { id: 'applications' as const, label: t.navApplications, icon: FileText },
    { id: 'chat' as const, label: t.navChat, icon: MessageSquare },
    { id: 'pricing' as const, label: t.navPricing, icon: CreditCard },
    { id: 'profile' as const, label: t.navProfile, icon: Lock },
    { id: 'admin_vault' as const, label: t.navAdminVault, icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2A1408] flex flex-col">
      {/* Top Bar Contract: Zone 1 Brand | Zone 2 Nav Links | Zone 3 Primary Action */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-8 px-3 sm:px-6 py-2.5 bg-white/95 backdrop-blur border-b-2 border-[#542B14]">
        {/* Zone 1: Brand wordmark + Green 3D WhatsApp Button with White Number & Direct Localized Inquiry */}
        <div className="flex flex-col items-start gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-base sm:text-xl font-extrabold tracking-tight text-[#2A1408] whitespace-nowrap cursor-pointer leading-tight"
          >
            <strong>Mouna Emploi · منى تشغيل</strong>
          </button>
          <a
            href={`https://wa.me/212687422391?text=${encodeURIComponent(
              t.whatsappInquiryText
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            title={t.whatsappInquiryText}
            className="btn-3d-whatsapp inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-extrabold tabular-nums tracking-wide text-white whitespace-nowrap leading-tight cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="w-4 h-4 text-white shrink-0"
            >
              <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.141 5.266-1.375c1.469.797 3.109 1.219 4.766 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.828 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.188.109-1.922-.125-.453-.141-1.031-.328-1.766-.641-3.109-1.344-5.141-4.484-5.297-4.688-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.313.609-.391.813-.391.203 0 .406.016.578.016.188 0 .438-.078.688.516.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.094.203-.141.328-.297.5-.156.172-.313.391-.453.516-.141.141-.297.297-.125.594.172.297.766 1.266 1.641 2.047 1.125 1 2.078 1.313 2.375 1.469.297.156.469.125.641-.078.172-.203.75-.875.953-1.172.203-.297.406-.25.688-.141.281.109 1.766.828 2.063.984.297.156.5.219.578.344.078.141.078.734-.172 1.438z" />
            </svg>
            <strong className="text-white">212 687422391</strong>
          </a>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#5C2E14]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`hover:text-[#2A1408] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#8B4A24] underline underline-offset-8 decoration-2' : ''
            }`}
          >
            {t.navDashboard}
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`hover:text-[#2A1408] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'jobs' ? 'text-[#8B4A24] underline underline-offset-8 decoration-2' : ''
            }`}
          >
            {t.navJobs}
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`hover:text-[#2A1408] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'candidates' ? 'text-[#8B4A24] underline underline-offset-8 decoration-2' : ''
            }`}
          >
            {t.navCandidates}
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`hover:text-[#2A1408] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'applications' ? 'text-[#8B4A24] underline underline-offset-8 decoration-2' : ''
            }`}
          >
            {t.navApplications}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`hover:text-[#2A1408] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'chat' ? 'text-[#8B4A24] underline underline-offset-8 decoration-2' : ''
            }`}
          >
            {t.navChat}
          </button>
        </nav>

        {/* Zone 3: Primary Action (3D Animated Brown Button with White Text) */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <button
              onClick={() => setShowCreateJobModal(true)}
              className="btn-3d-brown px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.postJobBtn}
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="btn-3d-brown px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.signInGoogle}
            </button>
          )}
        </div>
      </header>

      {/* Real-time Push Toast Banner */}
      {livePushToast && (
        <div className="frame-3d-brown mx-3 sm:mx-6 mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bell className="w-4 h-4 text-[#FCD34D] shrink-0" />
            <span className="font-semibold text-white truncate">
              {lang === 'fr' ? livePushToast.titleFr : livePushToast.titleAr}
            </span>
          </div>
          <button
            onClick={() => setLivePushToast(null)}
            className="btn-3d-espresso p-1.5 rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout: Mobile Compact 3D Bar + Desktop 3D Sidebar + White Canvas Viewport */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1440px] w-full mx-auto p-3 sm:p-5 md:p-6 gap-4 md:gap-6">
        {/* MOBILE ONLY: Compact 3D Brown Navigation & Utility Strip (Takes minimal vertical height so main content is immediately visible) */}
        <div className="md:hidden frame-3d-brown rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
                className="btn-3d-brown flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>{t.langToggle}</span>
              </button>

              <button
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                className="btn-3d-brown flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-white" />
                <span className="font-mono tabular-nums text-white">{unreadNotifCount}</span>
              </button>
            </div>

            {user && myProfile ? (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-[#FCD34D]">
                  {myProfile.aliasCode}
                </span>
                <button
                  onClick={() => seedMoroccanInterimData(user.uid, myProfile.aliasCode)}
                  className="btn-3d-espresso px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                >
                  + Démo
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn-3d-espresso p-1.5 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-[#FCD34D] font-medium truncate">
                100% Anonyme · Anti-PII
              </span>
            )}
          </div>

          {/* Horizontal Touch-Friendly Scrollable 3D Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'btn-3d-brown ring-2 ring-[#FCD34D]' : 'btn-3d-espresso'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-white" />
                  <span className="text-white">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DESKTOP ONLY: Full 3D Brown Sidebar Frame */}
        <aside className="hidden md:flex md:w-68 shrink-0 frame-3d-brown rounded-2xl p-5 flex-col justify-between gap-6 self-start">
          <div className="space-y-6">
            {/* Language & Notification Controls */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#784222]">
              <button
                onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
                className="btn-3d-brown flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>{t.langToggle}</span>
              </button>

              <button
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                className="btn-3d-brown relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-white" />
                <span className="font-mono tabular-nums text-white">{unreadNotifCount}</span>
              </button>
            </div>

            {/* Primary Workspace Navigation */}
            <div className="space-y-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer ${
                      active ? 'btn-3d-brown ring-2 ring-[#FCD34D]/60' : 'btn-3d-espresso'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-white" />
                    <span className="truncate text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Anonymity & Anti-PII Guarantee Box */}
            <div className="p-4 rounded-xl bg-[#2B1408] border border-[#784222] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FCD34D]">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Charte Anonymat PII</span>
              </div>
              <p className="text-xs text-[#F5EBE6] leading-relaxed">{t.privacyGuarantee}</p>
            </div>
          </div>

          {/* Account Status Footer */}
          <div className="pt-4 border-t border-[#784222] space-y-3">
            {user && myProfile ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#FCD34D]">
                    {myProfile.aliasCode}
                  </span>
                  <span className="text-[#F5EBE6]">
                    {isUserAdmin
                      ? t.roleAdmin
                      : myProfile.role === 'recruiter'
                      ? t.roleRecruiter
                      : t.roleCandidate}
                  </span>
                </div>
                <div className="text-xs text-[#E6D5C7] truncate">
                  {myProfile.isPremium ? t.priorityLabel : 'Standard'} · {myProfile.city}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => seedMoroccanInterimData(user.uid, myProfile.aliasCode)}
                    className="btn-3d-brown flex-1 px-2.5 py-2 text-xs font-semibold rounded-lg truncate cursor-pointer"
                  >
                    {t.seedDemoBtn}
                  </button>
                  <button
                    onClick={handleSignOut}
                    title={t.signOut}
                    className="btn-3d-espresso p-2 rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-[#F5EBE6]">
                  {lang === 'fr'
                    ? 'Connectez-vous pour postuler, publier des offres ou discuter en direct.'
                    : 'سجل الدخول للترشح أو نشر العروض أو المحادثة الفورية.'}
                </p>
                <button
                  onClick={handleSignIn}
                  className="btn-3d-brown w-full py-2.5 px-3 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {t.signInGoogle}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Viewport on Crisp White Background */}
        <main className="flex-1 min-w-0 space-y-6 md:space-y-8 overflow-y-auto pb-12">
          {/* Real-Time Push Notification Drawer */}
          {showNotifDrawer && (
            <section className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#FCD34D]" />
                  <span>{t.notificationsTitle}</span>
                </h2>
                <button
                  onClick={() => setShowNotifDrawer(false)}
                  className="btn-3d-espresso p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-[#F5EBE6]">{t.noNotifications}</p>
              ) : (
                <div className="divide-y divide-[#784222] max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="py-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-white break-words">
                          {lang === 'fr' ? n.titleFr : n.titleAr}
                        </p>
                        <p className="text-[#E6D5C7] break-words">
                          {lang === 'fr' ? n.bodyFr : n.bodyAr}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className="btn-3d-brown px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          OK
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 1: ANALYTICAL DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8">
              {/* Hero Banner (3D Animated Brown Card) */}
              <div className="card-3d-brown p-5 sm:p-6 md:p-8 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="text-xs text-[#FCD34D] font-semibold">
                    {t.brandSub} · {onlineCount}{' '}
                    {lang === 'fr' ? 'session(s) temps réel' : 'متصل الآن'}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {t.heroTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#F5EBE6] leading-relaxed">
                    {t.heroSubtitle}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="btn-3d-brown flex-1 sm:flex-initial justify-center px-5 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
                  >
                    {t.navJobs}
                  </button>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="btn-3d-espresso flex-1 sm:flex-initial justify-center px-5 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
                  >
                    {t.navPricing}
                  </button>
                </div>
              </div>

              {/* 4-Column KPI Strip (2x2 Grid on Mobile, 4 Columns on Desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <div className="card-3d-brown p-4 sm:p-5 rounded-2xl space-y-1">
                  <span className="text-[11px] sm:text-xs text-[#E6D5C7] block truncate">
                    {t.kpiActiveOffers}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                    {displayJobs.filter((j) => j.status === 'open').length}
                  </div>
                  <span className="text-[11px] text-[#FCD34D] block truncate">
                    Casa · Tanger · Rabat
                  </span>
                </div>

                <div className="card-3d-brown p-4 sm:p-5 rounded-2xl space-y-1">
                  <span className="text-[11px] sm:text-xs text-[#E6D5C7] block truncate">
                    {t.kpiVerifiedProfiles}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                    {displayProfiles.length}
                  </div>
                  <span className="text-[11px] text-[#F5EBE6] block truncate">
                    100% Anonymisés
                  </span>
                </div>

                <div className="card-3d-brown p-4 sm:p-5 rounded-2xl space-y-1">
                  <span className="text-[11px] sm:text-xs text-[#E6D5C7] block truncate">
                    {t.kpiTotalApplications}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#FCD34D]">
                    {applications.length || 18}
                  </div>
                  <span className="text-[11px] text-[#F5EBE6] block truncate">
                    Suivi temps réel
                  </span>
                </div>

                <div className="card-3d-brown p-4 sm:p-5 rounded-2xl space-y-1">
                  <span className="text-[11px] sm:text-xs text-[#E6D5C7] block truncate">
                    {t.kpiAvgMatch}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#6EE7B7]">
                    89.4%
                  </div>
                  <span className="text-[11px] text-[#F5EBE6] block truncate">
                    CACES / ISO / HSE
                  </span>
                </div>
              </div>

              {/* Analytical Charts: Daily Activity & Sector Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      {lang === 'fr'
                        ? 'Activité Quotidienne — Candidatures & Placements'
                        : 'النشاط اليومي — الترشيحات والتعاقدات'}
                    </h2>
                    <span className="text-xs font-mono text-[#FCD34D] shrink-0">7j</span>
                  </div>
                  <div className="h-56 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyActivityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#784222" />
                        <XAxis dataKey="day" stroke="#F5EBE6" fontSize={11} />
                        <YAxis stroke="#F5EBE6" fontSize={11} width={30} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#2B1408',
                            borderColor: '#8B4A24',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="candidatures"
                          stroke="#FCD34D"
                          fill="#FCD34D"
                          fillOpacity={0.28}
                        />
                        <Area
                          type="monotone"
                          dataKey="placements"
                          stroke="#6EE7B7"
                          fill="#6EE7B7"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      {lang === 'fr'
                        ? 'Répartition des Missions par Secteur au Maroc'
                        : 'توزيع العروض حسب القطاعات الاقتصادية بالمغرب'}
                    </h2>
                    <span className="text-xs font-mono text-[#FCD34D] shrink-0">Live</span>
                  </div>
                  <div className="h-56 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorAnalyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#784222" />
                        <XAxis dataKey="sector" stroke="#F5EBE6" fontSize={11} />
                        <YAxis stroke="#F5EBE6" fontSize={11} width={30} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#2B1408',
                            borderColor: '#8B4A24',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" fill="#FCD34D" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Priority Interim Missions Preview (Mobile Stacked Cards + Desktop Table) */}
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {lang === 'fr'
                      ? 'Missions d’Intérim Prioritaires & Compatibilité Immédiate'
                      : 'عروض العمل المؤقت ذات الأولوية والتوافق الفوري'}
                  </h2>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="btn-3d-brown px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {lang === 'fr' ? 'Tout voir →' : 'الكل ←'}
                  </button>
                </div>

                {/* Mobile Responsive Stack */}
                <div className="md:hidden divide-y divide-[#784222] text-xs">
                  {filteredJobs.slice(0, 4).map((job) => {
                    const score = computeSkillMatch(
                      job.requiredSkills,
                      userCandidateSkills
                    );
                    return (
                      <div key={job.id} className="py-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[#FCD34D] font-mono">
                          <span>
                            {job.recruiterAlias} · {job.city}
                          </span>
                          <span className="text-[#6EE7B7] font-bold">
                            {t.matchScoreLabel} {score}%
                          </span>
                        </div>
                        <div className="font-bold text-white text-sm">
                          {lang === 'fr' ? job.titleFr : job.titleAr}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono tabular-nums text-white font-semibold">
                            {job.salaryMad.toLocaleString()} {t.salaryUnit}
                          </span>
                          <button
                            onClick={() => handleApplyToJob(job)}
                            className="btn-3d-brown px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                          >
                            {t.applyBtn}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#784222] text-[#E6D5C7]">
                        <th className="py-3 px-3 text-start font-semibold">Mission / Code</th>
                        <th className="py-3 px-3 text-start font-semibold">Ville & Secteur</th>
                        <th className="py-3 px-3 text-end font-semibold">Salaire</th>
                        <th className="py-3 px-3 text-end font-semibold">{t.matchScoreLabel}</th>
                        <th className="py-3 px-3 text-end font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#784222]/60">
                      {filteredJobs.slice(0, 4).map((job) => {
                        const score = computeSkillMatch(
                          job.requiredSkills,
                          userCandidateSkills
                        );
                        return (
                          <tr
                            key={job.id}
                            className="hover:bg-[#683517]/40 transition-colors"
                          >
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-white">
                                {lang === 'fr' ? job.titleFr : job.titleAr}
                              </div>
                              <div className="text-[#FCD34D] font-mono">
                                {job.recruiterAlias} · {job.durationWeeks} {t.weeksUnit}
                                {job.isPriority ? ` · ${t.priorityLabel}` : ''}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-[#F5EBE6]">
                              {job.city} · {job.sector}
                            </td>
                            <td className="py-3.5 px-3 text-end font-mono tabular-nums text-white font-semibold">
                              {job.salaryMad.toLocaleString()} {t.salaryUnit}
                            </td>
                            <td className="py-3.5 px-3 text-end font-mono tabular-nums font-bold text-[#6EE7B7]">
                              {score}%
                            </td>
                            <td className="py-3.5 px-3 text-end">
                              <button
                                onClick={() => handleApplyToJob(job)}
                                className="btn-3d-brown px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                              >
                                {t.applyBtn}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REAL-TIME JOBS & INTELLIGENT SKILL FILTERING */}
          {activeTab === 'jobs' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">{t.navJobs}</h1>
                  <p className="text-xs text-[#F5EBE6]">
                    {t.skillsFilterTitle} · {filteredJobs.length}{' '}
                    {lang === 'fr' ? 'missions disponibles' : 'عرض عمل متاح'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateJobModal(true)}
                  className="btn-3d-brown flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>{t.postJobBtn}</span>
                </button>
              </div>

              {/* Search & City / Priority Filter Bar */}
              <div className="frame-3d-brown p-4 sm:p-6 rounded-2xl space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2 relative">
                    <Search className="w-4 h-4 text-[#E6D5C7] absolute top-2.5 start-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="input-brown w-full ps-9 pe-3 py-2 text-xs rounded-lg"
                    />
                  </div>

                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="input-brown px-3 py-2 text-xs rounded-lg"
                  >
                    <option value="all">{t.cityAll}</option>
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setPriorityOnly(!priorityOnly)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                      priorityOnly
                        ? 'btn-3d-brown ring-2 ring-[#FCD34D]'
                        : 'btn-3d-espresso'
                    }`}
                  >
                    {t.priorityOnly}
                  </button>
                </div>

                {/* Interactive Skill Filter 3D Buttons */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#F5EBE6]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#FCD34D]" />
                      <span>{t.skillsFilterTitle}</span>
                    </span>
                    {(selectedSkills.length > 0 ||
                      selectedCity !== 'all' ||
                      priorityOnly ||
                      searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedSkills([]);
                          setSelectedCity('all');
                          setPriorityOnly(false);
                          setSearchQuery('');
                        }}
                        className="btn-3d-brown px-3 py-1 text-xs font-semibold rounded-md cursor-pointer"
                      >
                        {t.clearFilters}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MOROCCAN_SKILLS.map((skill) => {
                      const active = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkillFilter(skill)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                            active
                              ? 'btn-3d-brown ring-2 ring-[#FCD34D]'
                              : 'btn-3d-espresso'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Jobs Listing */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                {filteredJobs.map((job) => {
                  const matchScore = computeSkillMatch(
                    job.requiredSkills,
                    userCandidateSkills
                  );
                  const alreadyApplied = applications.some((a) => a.jobId === job.id);

                  return (
                    <div
                      key={job.id}
                      className="card-3d-brown p-4 sm:p-6 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6"
                    >
                      <div className="space-y-2.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#E6D5C7]">
                          <span className="font-mono text-[#FCD34D] font-bold">
                            {job.recruiterAlias}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{job.city}</span>
                          <span aria-hidden="true">·</span>
                          <span>{job.sector}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {job.durationWeeks} {t.weeksUnit}
                          </span>
                          {job.isPriority && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#FCD34D] font-semibold">
                                {t.priorityLabel}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {lang === 'fr' ? job.titleFr : job.titleAr}
                        </h3>

                        <p className="text-xs text-[#F5EBE6] leading-relaxed">
                          {lang === 'fr' ? job.descriptionFr : job.descriptionAr}
                        </p>

                        <div className="text-xs text-[#E6D5C7]">
                          <span className="text-[#FCD34D] font-semibold">
                            Compétences requises :{' '}
                          </span>
                          {job.requiredSkills.join(' · ')}
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 shrink-0 border-t lg:border-t-0 pt-3.5 lg:pt-0 border-[#784222]">
                        <div className="text-start lg:text-end">
                          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-white">
                            {job.salaryMad.toLocaleString()} {t.salaryUnit}
                          </div>
                          <div className="text-xs font-mono tabular-nums text-[#6EE7B7] font-semibold">
                            {t.matchScoreLabel} : {matchScore}%
                          </div>
                        </div>

                        {alreadyApplied ? (
                          <button
                            onClick={() => setActiveTab('applications')}
                            className="btn-3d-espresso px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
                          >
                            {t.appliedBadge}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApplyToJob(job)}
                            className="btn-3d-brown px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
                          >
                            {t.applyBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ANONYMIZED CANDIDATE POOL (VIVIERS PROFILS) */}
          {activeTab === 'candidates' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">{t.navCandidates}</h1>
                  <p className="text-xs text-[#F5EBE6]">{t.privacyGuarantee}</p>
                </div>
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="input-brown px-3.5 py-2 text-xs rounded-lg w-full sm:w-auto"
                >
                  <option value="all">{t.availabilityAll}</option>
                  <option value="immediate">{t.availabilityImmediate}</option>
                  <option value="notice_15d">{t.availabilityNotice15d}</option>
                  <option value="on_mission">{t.availabilityOnMission}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="card-3d-brown p-4 sm:p-6 rounded-2xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-[#E6D5C7]">
                        <span className="font-mono font-bold text-[#FCD34D]">
                          {cand.aliasCode}
                        </span>
                        <span>
                          {cand.city} · {cand.experienceYears} ans d’exp.
                          {cand.isPremium ? ` · ${t.priorityLabel}` : ''}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {lang === 'fr' ? cand.titleFr : cand.titleAr}
                      </h3>

                      <p className="text-xs text-[#F5EBE6] leading-relaxed">
                        {cand.bioSummary}
                      </p>

                      <div className="text-xs text-[#FCD34D]">
                        {cand.skills.join(' · ')}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#784222] flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs font-mono tabular-nums text-white">
                        {cand.dailyRateMad} {t.dailyRateUnit} ·{' '}
                        <span className="text-[#6EE7B7] font-semibold">
                          {cand.availability === 'immediate'
                            ? t.availabilityImmediate
                            : cand.availability === 'notice_15d'
                            ? t.availabilityNotice15d
                            : t.availabilityOnMission}
                        </span>
                      </div>

                      <button
                        onClick={async () => {
                          if (!user || !myProfile) {
                            await handleSignIn();
                            return;
                          }
                          const firstJob = displayJobs[0];
                          let jobId = firstJob.id;
                          if (jobId.startsWith('preview_')) {
                            const ref = await addDoc(collection(db, 'jobs'), {
                              recruiterId: user.uid,
                              recruiterAlias: myProfile.aliasCode,
                              titleFr: firstJob.titleFr,
                              titleAr: firstJob.titleAr,
                              sector: firstJob.sector,
                              city: firstJob.city,
                              contractType: firstJob.contractType,
                              durationWeeks: firstJob.durationWeeks,
                              salaryMad: firstJob.salaryMad,
                              requiredSkills: firstJob.requiredSkills,
                              descriptionFr: firstJob.descriptionFr,
                              descriptionAr: firstJob.descriptionAr,
                              isPriority: firstJob.isPriority,
                              status: 'open',
                              createdAt: serverTimestamp(),
                              updatedAt: serverTimestamp(),
                            });
                            jobId = ref.id;
                          }
                          const threadRef = await addDoc(collection(db, 'chats'), {
                            jobId,
                            jobTitleFr: firstJob.titleFr,
                            candidateId: cand.uid.startsWith('preview_')
                              ? user.uid
                              : cand.uid,
                            candidateAlias: cand.aliasCode,
                            recruiterId: user.uid,
                            recruiterAlias: myProfile.aliasCode,
                            lastMessagePreview: `Contact direct initié avec ${cand.aliasCode}`,
                            status: 'active',
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                          });
                          setActiveThreadId(threadRef.id);
                          setActiveTab('chat');
                        }}
                        className="btn-3d-brown px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
                      >
                        {t.openChatBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: APPLICATION TRACKING DASHBOARD */}
          {activeTab === 'applications' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl">
                <h1 className="text-lg sm:text-xl font-bold text-white">{t.navApplications}</h1>
                <p className="text-xs text-[#F5EBE6]">
                  {lang === 'fr'
                    ? 'Suivi en temps réel des étapes de recrutement (En attente → Présélectionné → Entretien → Embauché).'
                    : 'تتبع فوري لمراحل التوظيف (قيد المراجعة ← مقبول أولياً ← مقابلة ← تم التعاقد).'}
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="card-3d-brown p-6 sm:p-8 rounded-2xl text-center space-y-4">
                  <p className="text-sm text-white">
                    {lang === 'fr'
                      ? 'Aucune candidature active dans votre dossier pour le moment.'
                      : 'لا توجد ترشيحات نشطة في ملفكم حالياً.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="btn-3d-brown px-5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {lang === 'fr'
                      ? 'Explorer les Missions d’Intérim'
                      : 'استكشاف عروض العمل المؤقت'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Application Cards */}
                  <div className="md:hidden space-y-4">
                    {applications.map((appItem) => (
                      <div
                        key={appItem.id}
                        className="card-3d-brown p-4 rounded-2xl space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[#FCD34D]">
                          <span>
                            {appItem.candidateAlias} ↔ {appItem.recruiterAlias}
                          </span>
                          <span className="text-[#6EE7B7] font-bold">
                            {appItem.matchScore}%
                          </span>
                        </div>
                        <div className="font-bold text-white text-sm">
                          {lang === 'fr' ? appItem.jobTitleFr : appItem.jobTitleAr}
                        </div>
                        <div className="text-[#FCD34D] font-semibold">
                          Statut :{' '}
                          {appItem.status === 'pending'
                            ? t.appPending
                            : appItem.status === 'shortlisted'
                            ? t.appShortlisted
                            : appItem.status === 'interview'
                            ? t.appInterview
                            : appItem.status === 'hired'
                            ? t.appHired
                            : t.appRejected}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#784222]">
                          {!(appItem.status in { hired: 1, rejected: 1 }) &&
                            (user?.uid === appItem.recruiterId || isUserAdmin) && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateApplicationStatus(appItem, 'shortlisted')
                                  }
                                  className="btn-3d-espresso px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  {t.appShortlisted}
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateApplicationStatus(appItem, 'interview')
                                  }
                                  className="btn-3d-brown px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  {t.appInterview}
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateApplicationStatus(appItem, 'hired')
                                  }
                                  className="btn-3d-brown px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  {t.appHired}
                                </button>
                              </>
                            )}
                          <button
                            onClick={() => setActiveTab('chat')}
                            className="btn-3d-brown px-3 py-1.5 rounded-lg cursor-pointer ms-auto"
                          >
                            Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Applications Table */}
                  <div className="hidden md:block card-3d-brown p-6 rounded-2xl overflow-x-auto">
                    <table className="w-full text-start border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#784222] text-[#E6D5C7]">
                          <th className="py-3 px-3 text-start font-semibold">Mission</th>
                          <th className="py-3 px-3 text-start font-semibold">Candidat / Recruteur</th>
                          <th className="py-3 px-3 text-end font-semibold">Matching</th>
                          <th className="py-3 px-3 text-start font-semibold">Statut Actuel</th>
                          <th className="py-3 px-3 text-end font-semibold">Décision / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#784222]/60">
                        {applications.map((appItem) => (
                          <tr key={appItem.id} className="hover:bg-[#683517]/40">
                            <td className="py-3.5 px-3 font-bold text-white">
                              {lang === 'fr' ? appItem.jobTitleFr : appItem.jobTitleAr}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-[#F5EBE6]">
                              {appItem.candidateAlias} ↔ {appItem.recruiterAlias}
                            </td>
                            <td className="py-3.5 px-3 text-end font-mono tabular-nums text-[#6EE7B7] font-bold">
                              {appItem.matchScore}%
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-[#FCD34D]">
                              {appItem.status === 'pending'
                                ? t.appPending
                                : appItem.status === 'shortlisted'
                                ? t.appShortlisted
                                : appItem.status === 'interview'
                                ? t.appInterview
                                : appItem.status === 'hired'
                                ? t.appHired
                                : t.appRejected}
                            </td>
                            <td className="py-3.5 px-3 text-end">
                              <div className="flex items-center justify-end gap-2">
                                {!(appItem.status in { hired: 1, rejected: 1 }) &&
                                  (user?.uid === appItem.recruiterId || isUserAdmin) && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleUpdateApplicationStatus(appItem, 'shortlisted')
                                        }
                                        className="btn-3d-espresso px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        {t.appShortlisted}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleUpdateApplicationStatus(appItem, 'interview')
                                        }
                                        className="btn-3d-brown px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        {t.appInterview}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleUpdateApplicationStatus(appItem, 'hired')
                                        }
                                        className="btn-3d-brown px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        {t.appHired}
                                      </button>
                                    </>
                                  )}
                                <button
                                  onClick={() => setActiveTab('chat')}
                                  className="btn-3d-brown px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Chat
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: ANONYMIZED REAL-TIME CHAT WITH ANTI-PII REDACTION */}
          {activeTab === 'chat' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl">
                <h1 className="text-lg sm:text-xl font-bold text-white">{t.chatTitle}</h1>
                <p className="text-xs text-[#F5EBE6]">{t.privacyGuarantee}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 min-h-[420px]">
                {/* Threads List */}
                <div className="card-3d-brown p-4 sm:p-5 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-[#FCD34D] pb-2 border-b border-[#784222]">
                    Canaux Anonymisés Actifs ({chatThreads.length})
                  </div>
                  {chatThreads.length === 0 ? (
                    <p className="text-xs text-[#F5EBE6] py-6">
                      {lang === 'fr'
                        ? 'Postulez à une mission ou contactez un profil pour ouvrir un canal sécurisé.'
                        : 'ترشح لمهمة أو تواصل مع كفاءة لفتح قناة محادثة آمنة.'}
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 lg:max-h-96 overflow-y-auto">
                      {chatThreads.map((th) => (
                        <button
                          key={th.id}
                          onClick={() => setActiveThreadId(th.id)}
                          className={`w-full text-start p-3 rounded-xl cursor-pointer ${
                            activeThreadId === th.id
                              ? 'btn-3d-brown ring-2 ring-[#FCD34D]'
                              : 'btn-3d-espresso'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono text-[#FCD34D]">
                            <span>
                              {th.candidateAlias} ↔ {th.recruiterAlias}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-1">
                            {th.jobTitleFr}
                          </div>
                          <div className="text-xs text-[#E6D5C7] truncate mt-0.5">
                            {th.lastMessagePreview}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Conversation Window */}
                <div className="lg:col-span-2 card-3d-brown p-4 sm:p-6 rounded-2xl flex flex-col justify-between gap-4">
                  <div className="space-y-3 overflow-y-auto max-h-80 sm:max-h-96 pr-1">
                    {threadMessages.length === 0 ? (
                      <div className="text-xs text-[#F5EBE6] py-12 text-center">
                        {lang === 'fr'
                          ? 'Sélectionnez une discussion pour échanger en temps réel sans divulguer vos coordonnées.'
                          : 'اختر محادثة للتواصل الفوري دون الكشف عن بياناتك الشخصية.'}
                      </div>
                    ) : (
                      threadMessages.map((msg) => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isMe ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div className="text-[11px] font-mono text-[#FCD34D] mb-1">
                              {msg.senderAlias}
                              {msg.redactedFlag ? ' · [Filtre Anti-PII Appliqué]' : ''}
                            </div>
                            <div
                              className={`max-w-md px-4 py-2.5 rounded-xl text-xs leading-relaxed text-white break-words ${
                                isMe
                                  ? 'bg-[#8B4A24] border border-[#B0673B] shadow-md'
                                  : 'bg-[#2B1408] border border-[#784222]'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {chatRedactedNotice && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#2B1408] border border-[#FCD34D] text-xs text-[#FCD34D]">
                      {t.chatRedactedAlert}
                    </div>
                  )}

                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-[#784222]"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={t.chatInputPlaceholder}
                      disabled={!activeThreadId}
                      className="input-brown flex-1 min-w-0 px-3.5 py-2.5 text-xs rounded-xl disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!activeThreadId || !chatInput.trim()}
                      className="btn-3d-brown flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>{t.chatSendBtn}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RECURRING MONTHLY SUBSCRIPTIONS & PRIORITY MATCHING */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="card-3d-brown p-5 sm:p-6 rounded-2xl space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{t.pricingTitle}</h1>
                <p className="text-xs text-[#F5EBE6] leading-relaxed">{t.pricingSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                {(
                  [
                    {
                      id: 'pro_candidate' as const,
                      name: t.planCandidateName,
                      audience: t.planCandidateAudience,
                      priceText: t.planCandidatePrice,
                      priceMad: 99,
                      features: [
                        'Dossier placé en tête des recherches recruteurs',
                        'Alertes Push instantanées dès publication d’offre',
                        'Badge Intérimaire Vérifié Prioritaire',
                        'Candidatures prioritaires illimitées',
                      ],
                    },
                    {
                      id: 'pro_recruiter' as const,
                      name: t.planRecruiterName,
                      audience: t.planRecruiterAudience,
                      priceText: t.planRecruiterPrice,
                      priceMad: 490,
                      features: [
                        'Jusqu’à 25 missions prioritaires simultanées',
                        'Algorithme de présélection par compétences techniques',
                        'Messagerie temps réel multi-candidats anonymisée',
                        'Demande de mise en relation administrative sous 2h',
                      ],
                    },
                    {
                      id: 'enterprise' as const,
                      name: t.planEnterpriseName,
                      audience: t.planEnterpriseAudience,
                      priceText: t.planEnterprisePrice,
                      priceMad: 1490,
                      features: [
                        'Missions illimitées multi-sites (Casa, Tanger, Kénitra)',
                        'Gestionnaire de compte Mouna Emploi dédié',
                        'Tableaux de bord analytiques & export RH',
                        'Facturation mensuelle récurrente automatisée',
                      ],
                    },
                  ]
                ).map((plan) => {
                  const isCurrentPlan = myProfile?.subscriptionPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className="card-3d-brown p-5 sm:p-6 rounded-2xl flex flex-col justify-between gap-6"
                    >
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white">{plan.name}</h3>
                          <p className="text-xs text-[#E6D5C7]">{plan.audience}</p>
                        </div>

                        <div className="text-2xl font-bold font-mono tabular-nums text-[#FCD34D]">
                          {plan.priceText}
                        </div>

                        <ul className="space-y-2.5 text-xs text-white">
                          {plan.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-[#6EE7B7] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {isCurrentPlan ? (
                        <div className="btn-3d-espresso w-full py-2.5 text-center text-xs font-semibold rounded-xl">
                          {t.activePlanBadge}
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setCheckoutPlan({
                              id: plan.id,
                              name: plan.name,
                              priceMad: plan.priceMad,
                            })
                          }
                          className="btn-3d-brown w-full py-2.5 px-4 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          {t.subscribeAction}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {subscriptions.length > 0 && (
                <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-3">
                  <h2 className="text-sm font-bold text-white">
                    Historique des Abonnements Mensuels Récurrents
                  </h2>
                  <div className="divide-y divide-[#784222] text-xs">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="font-mono text-[#FCD34D] font-bold">{sub.planId}</span>
                        <span className="font-mono tabular-nums text-white">
                          {sub.amountMad} MAD / mois · Carte •••• {sub.paymentMethodLast4}
                        </span>
                        <span className="text-[#6EE7B7] font-semibold">{sub.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: MY PROFILE & ISOLATED PII EDITOR */}
          {activeTab === 'profile' && (
            <div className="space-y-5 sm:space-y-6 max-w-4xl">
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl">
                <h1 className="text-lg sm:text-xl font-bold text-white">{t.onboardingTitle}</h1>
                <p className="text-xs text-[#F5EBE6]">{t.onboardingSub}</p>
              </div>

              {!user ? (
                <div className="card-3d-brown p-6 sm:p-8 rounded-2xl space-y-4">
                  <p className="text-sm text-white">
                    Connectez-vous pour gérer votre profil anonymisé et votre coffre-fort de coordonnées.
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="btn-3d-brown px-5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {t.signInGoogle}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfileAndPII} className="space-y-5 sm:space-y-6">
                  {/* Section A: Public Anonymized Profile */}
                  <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#784222] pb-3">
                      <h2 className="text-sm font-bold text-white">
                        1. Profil Public Anonymisé (Code{' '}
                        <span className="font-mono text-[#FCD34D]">
                          {myProfile?.aliasCode}
                        </span>
                        )
                      </h2>
                      <span className="text-xs text-[#6EE7B7] font-semibold">
                        Zéro PII exposé
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">Titre Professionnel (FR)</label>
                        <input
                          type="text"
                          value={profileForm.titleFr}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, titleFr: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">المسمى الوظيفي (AR)</label>
                        <input
                          type="text"
                          value={profileForm.titleAr}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, titleAr: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">Ville au Maroc</label>
                        <select
                          value={profileForm.city}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, city: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg"
                        >
                          {MOROCCAN_CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">
                          Tarif Journalier Indicatif (MAD/jour)
                        </label>
                        <input
                          type="number"
                          value={profileForm.dailyRateMad}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              dailyRateMad: Number(e.target.value),
                            })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-[#F5EBE6]">
                        Résumé Professionnel Anonymisé (les numéros et e-mails seront automatiquement masqués)
                      </label>
                      <textarea
                        rows={3}
                        value={profileForm.bioSummary}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, bioSummary: e.target.value })
                        }
                        className="input-brown w-full px-3 py-2 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Section B: Isolated PII Vault */}
                  <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#784222] pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#FCD34D] shrink-0" />
                        <h2 className="text-sm font-bold text-white">
                          2. Coordonnées Personnelles Identifiables (Coffre-Fort `/user_pii`)
                        </h2>
                      </div>
                      <span className="text-xs text-[#FCD34D] font-semibold">
                        Invisible pour les autres candidats/recruteurs
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">{t.piiFullName}</label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, fullName: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">{t.piiPhone}</label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">{t.piiCinIce}</label>
                        <input
                          type="text"
                          value={profileForm.cinOrIce}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, cinOrIce: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#F5EBE6]">{t.piiCompany}</label>
                        <input
                          type="text"
                          value={profileForm.companyLegalName}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              companyLegalName: e.target.value,
                            })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[#F5EBE6]">{t.piiAddress}</label>
                        <input
                          type="text"
                          value={profileForm.exactAddress}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, exactAddress: e.target.value })
                          }
                          className="input-brown w-full px-3 py-2 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {profileSaveFeedback && (
                    <div className="card-3d-brown p-4 rounded-xl text-xs text-[#6EE7B7] font-semibold">
                      {profileSaveFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-3d-brown w-full sm:w-auto px-6 py-3 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {t.saveProfileBtn}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 8: ADMIN PII VAULT (STRICTLY FOR PLATFORM ADMINISTRATORS) */}
          {activeTab === 'admin_vault' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="card-3d-brown p-4 sm:p-6 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#FCD34D] text-xs font-semibold">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Accès Administrateur Mouna Emploi (Zero-Trust Firestore Rules)</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white">{t.adminVaultTitle}</h1>
                <p className="text-xs text-[#F5EBE6]">{t.adminVaultSubtitle}</p>
              </div>

              {!isUserAdmin ? (
                <div className="card-3d-brown p-6 sm:p-8 rounded-2xl space-y-2">
                  <div className="text-sm font-bold text-[#FCD34D]">
                    Accès Refusé — Protection des Données Personnelles (Loi 09-08 Maroc)
                  </div>
                  <p className="text-xs text-[#F5EBE6] leading-relaxed">
                    Votre compte n’est pas administrateur de la plateforme. Conformément aux règles de sécurité Firestore (`match /user_pii`), seuls les administrateurs Mouna Emploi peuvent consulter les identités légales, numéros de téléphone, e-mails et CIN/ICE des utilisateurs.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile PII Vault Cards */}
                  <div className="md:hidden space-y-4">
                    {allPIIVault.map((pii) => (
                      <div
                        key={pii.id}
                        className="card-3d-brown p-4 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">
                            {pii.fullName}
                          </span>
                          <span className="font-mono text-[#FCD34D]">
                            {pii.cinOrIce}
                          </span>
                        </div>
                        <div className="font-mono text-[#6EE7B7] font-semibold">
                          {pii.phone}
                        </div>
                        <div className="font-mono text-[#F5EBE6] break-all">
                          {pii.email}
                        </div>
                        <div className="text-[#E6D5C7]">{pii.exactAddress}</div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop PII Vault Table */}
                  <div className="hidden md:block card-3d-brown p-6 rounded-2xl overflow-x-auto">
                    <table className="w-full text-start border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#784222] text-[#E6D5C7]">
                          <th className="py-3 px-3 text-start font-semibold">UID</th>
                          <th className="py-3 px-3 text-start font-semibold">{t.piiFullName}</th>
                          <th className="py-3 px-3 text-start font-semibold">{t.piiEmail}</th>
                          <th className="py-3 px-3 text-start font-semibold">{t.piiPhone}</th>
                          <th className="py-3 px-3 text-start font-semibold">{t.piiCinIce}</th>
                          <th className="py-3 px-3 text-start font-semibold">{t.piiAddress}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#784222]/60">
                        {allPIIVault.map((pii) => (
                          <tr key={pii.id} className="hover:bg-[#683517]/40">
                            <td className="py-3 px-3 font-mono text-[#FCD34D]">
                              {pii.uid.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-3 font-bold text-white">
                              {pii.fullName}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#F5EBE6]">{pii.email}</td>
                            <td className="py-3 px-3 font-mono text-[#6EE7B7] font-semibold">
                              {pii.phone}
                            </td>
                            <td className="py-3 px-3 font-mono text-white">
                              {pii.cinOrIce}
                            </td>
                            <td className="py-3 px-3 text-[#F5EBE6]">{pii.exactAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CREATE NEW INTERIM JOB OFFER */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card-3d-brown w-full max-w-lg p-5 sm:p-6 rounded-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#784222] pb-3">
              <h3 className="text-base font-bold text-white">{t.postJobBtn}</h3>
              <button
                onClick={() => setShowCreateJobModal(false)}
                className="btn-3d-espresso p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#F5EBE6]">Intitulé de la Mission (Français)</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={newJobForm.titleFr}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, titleFr: e.target.value })
                  }
                  placeholder="Ex: Technicien Maintenance Automatisme 3x8"
                  className="input-brown w-full px-3 py-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#F5EBE6]">عنوان المهمة (بالعربية)</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={newJobForm.titleAr}
                  onChange={(e) =>
                    setNewJobForm({ ...newJobForm, titleAr: e.target.value })
                  }
                  placeholder="مثال: تقني صيانة وأتمتة صناعية"
                  className="input-brown w-full px-3 py-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5EBE6]">Ville</label>
                  <select
                    value={newJobForm.city}
                    onChange={(e) =>
                      setNewJobForm({ ...newJobForm, city: e.target.value })
                    }
                    className="input-brown w-full px-3 py-2 rounded-lg"
                  >
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#F5EBE6]">Salaire Net Mensuel (MAD)</label>
                  <input
                    type="number"
                    required
                    min={2000}
                    value={newJobForm.salaryMad}
                    onChange={(e) =>
                      setNewJobForm({
                        ...newJobForm,
                        salaryMad: Number(e.target.value),
                      })
                    }
                    className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#F5EBE6]">
                  Description Anonymisée (Coordonnées automatiquement masquées)
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={newJobForm.descriptionFr}
                  onChange={(e) =>
                    setNewJobForm({
                      ...newJobForm,
                      descriptionFr: e.target.value,
                      descriptionAr: e.target.value,
                    })
                  }
                  className="input-brown w-full px-3 py-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#784222]">
                <button
                  type="button"
                  onClick={() => setShowCreateJobModal(false)}
                  className="btn-3d-espresso px-4 py-2 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-3d-brown px-4 py-2 font-semibold rounded-xl cursor-pointer"
                >
                  Publier en Temps Réel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SECURE MONTHLY SUBSCRIPTION CHECKOUT */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="card-3d-brown w-full max-w-md p-5 sm:p-6 rounded-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#784222] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{checkoutPlan.name}</h3>
                <p className="text-xs font-mono text-[#FCD34D]">
                  {checkoutPlan.priceMad} MAD / mois ( Prélèvement mensuel récurrent )
                </p>
              </div>
              <button
                onClick={() => setCheckoutPlan(null)}
                className="btn-3d-espresso p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleProcessSubscription} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#F5EBE6]">
                  Numéro de Carte CMI / Visa / Mastercard
                </label>
                <input
                  type="text"
                  required
                  value={cardForm.cardNumber}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, cardNumber: e.target.value })
                  }
                  className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#F5EBE6]">Expiration (MM/AA)</label>
                  <input
                    type="text"
                    required
                    value={cardForm.expiry}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, expiry: e.target.value })
                    }
                    className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#F5EBE6]">Code CVC</label>
                  <input
                    type="text"
                    required
                    value={cardForm.cvc}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, cvc: e.target.value })
                    }
                    className="input-brown w-full px-3 py-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              {checkoutStatus && (
                <div className="p-3 rounded-xl bg-[#2B1408] border border-[#6EE7B7] text-[#6EE7B7] font-semibold">
                  {checkoutStatus}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#784222]">
                <button
                  type="button"
                  onClick={() => setCheckoutPlan(null)}
                  className="btn-3d-espresso px-4 py-2 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="btn-3d-brown px-4 py-2 font-semibold rounded-xl cursor-pointer"
                >
                  Confirmer {checkoutPlan.priceMad} MAD/mois
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
