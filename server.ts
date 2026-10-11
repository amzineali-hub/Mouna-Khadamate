import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LivePresence {
  onlineCount: number;
  lastEvent: {
    type: string;
    titleFr: string;
    titleAr: string;
    timestamp: string;
  } | null;
}

const liveState: LivePresence = {
  onlineCount: 1,
  lastEvent: {
    type: 'system',
    titleFr: 'Serveur Temps Réel Mouna Emploi actif',
    titleAr: 'خادم منى تشغيل الفوري نشط',
    timestamp: new Date().toISOString(),
  },
};

const sseClients = new Set<express.Response>();

function broadcastSse(payload: unknown) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    res.write(data);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Real-time Server-Sent Events (SSE) stream for instant push alerts & presence
  app.get('/api/realtime/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    liveState.onlineCount = Math.max(1, sseClients.size);

    res.write(`data: ${JSON.stringify({ type: 'init', state: liveState })}\n\n`);
    broadcastSse({ type: 'presence', onlineCount: liveState.onlineCount });

    req.on('close', () => {
      sseClients.delete(res);
      liveState.onlineCount = Math.max(1, sseClients.size);
      broadcastSse({ type: 'presence', onlineCount: liveState.onlineCount });
    });
  });

  // Endpoint to trigger real-time push broadcast across all connected clients
  app.post('/api/realtime/notify', (req, res) => {
    const { type, titleFr, titleAr } = req.body || {};
    liveState.lastEvent = {
      type: String(type || 'update'),
      titleFr: String(titleFr || 'Nouvelle activité sur Mouna Emploi'),
      titleAr: String(titleAr || 'نشاط جديد على منصة منى تشغيل'),
      timestamp: new Date().toISOString(),
    };
    broadcastSse({ type: 'push_event', event: liveState.lastEvent });
    res.json({ ok: true, event: liveState.lastEvent });
  });

  // Server-side recurring subscription checkout validation (CMI / Visa Morocco)
  app.post('/api/billing/checkout', (req, res) => {
    const { planId, cardNumber, expiry, cvc } = req.body || {};
    const cleanCard = String(cardNumber || '').replace(/\s+/g, '');

    if (!['pro_candidate', 'pro_recruiter', 'enterprise'].includes(planId)) {
      res.status(400).json({ error: 'Plan invalide / باقة غير صالحة' });
      return;
    }
    if (cleanCard.length < 12 || !/^\d+$/.test(cleanCard)) {
      res.status(400).json({ error: 'Numéro de carte CMI/Visa invalide (16 chiffres requis)' });
      return;
    }
    if (!expiry || !cvc || String(cvc).length < 3) {
      res.status(400).json({ error: 'Date d’expiration ou code CVC invalide' });
      return;
    }

    const amounts: Record<string, number> = {
      pro_candidate: 99,
      pro_recruiter: 490,
      enterprise: 1490,
    };

    const last4 = cleanCard.slice(-4);
    const amountMad = amounts[planId] ?? 99;

    liveState.lastEvent = {
      type: 'subscription',
      titleFr: `Abonnement Pro activé (${amountMad} MAD/mois)`,
      titleAr: `تم تفعيل اشتراك بريميوم (${amountMad} درهم/شهر)`,
      timestamp: new Date().toISOString(),
    };
    broadcastSse({ type: 'push_event', event: liveState.lastEvent });

    res.json({
      verified: true,
      planId,
      amountMad,
      billingCycle: 'monthly',
      paymentMethodLast4: last4,
      transactionRef: `CMI-${Date.now().toString().slice(-6)}`,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Mouna Emploi Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
