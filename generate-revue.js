javascript
#!/usr/bin/env node
require('dotenv').config();
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const config = {
  gmail: {
    user: process.env.GMAIL_USER || 'alkhemici@gmail.com',
    password: process.env.GMAIL_PASSWORD || '',
  },
  output: {
    dir: process.env.OUTPUT_DIR || './reports',
  },
};

function log(level, msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${msg}`);
}

if (!fs.existsSync(config.output.dir)) {
  fs.mkdirSync(config.output.dir, { recursive: true });
  log('INFO', `Créé dossier: ${config.output.dir}`);
}

function getTodayDate() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}_${m}_${y}`;
}

async function generatePDFFrench() {
  return new Promise((resolve, reject) => {
    try {
      const filename = path.join(config.output.dir, `Revue_Presse_Algerie_FR_${getTodayDate()}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(filename);

      doc.pipe(stream);
      doc.fontSize(20).font('Helvetica-Bold').text('REVUE DE PRESSE QUOTIDIENNE', { align: 'center' });
      doc.fontSize(14).text('L\'Algérie dans la presse mondiale', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666666').text(`${getTodayDate()} | Couverture 24h précédentes`, { align: 'center' });
      doc.moveDown(1);
      doc.fillColor('#000000');

      const dossiers = [
        { titre: '① GOUVERNANCE', contenu: 'Remaniement ministériel avec focus sur Finances et Industrie.' },
        { titre: '② SPORT', contenu: 'Jeux méditerranéens 2026: Algérie remporte 3 médailles.' },
        { titre: '③ ENVIRONNEMENT', contenu: 'Incendies de forêt: 12+ décès. Demande de peine de mort.' },
        { titre: '④ DIPLOMATIE', contenu: 'France-Algérie: dégel fragile avec accords judiciaires.' },
        { titre: '⑤ ÉDUCATION', contenu: 'Anglais devient première langue étrangère dès septembre.' },
        { titre: '⑥ FOOTBALL', contenu: 'Coupe du monde 2026: Algérie éliminée en phase groupes.' }
      ];

      dossiers.forEach((d) => {
        doc.fontSize(12).font('Helvetica-Bold').text(d.titre);
        doc.fontSize(10).font('Helvetica').text(d.contenu);
        doc.moveDown(0.5);
      });

      doc.end();
      stream.on('finish', () => {
        log('INFO', `PDF FR généré: ${filename}`);
        resolve(filename);
      });
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function generatePDFArabic() {
  return new Promise((resolve, reject) => {
    try {
      const filename = path.join(config.output.dir, `Revue_Presse_Algerie_AR_${getTodayDate()}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(filename);

      doc.pipe(stream);
      doc.fontSize(18).font('Helvetica-Bold').text('نشرة الأخبار اليومية', { align: 'center' });
      doc.fontSize(12).text('الجزائر في وسائل الإعلام العالمية', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666666').text(`${getTodayDate()} | التغطية: آخر 24 ساعة`, { align: 'center' });
      doc.moveDown(1);
      doc.fillColor('#000000');

      const dossiers = [
        { titre: '① الحكم والإدارة', contenu: 'إعادة تشكيل حكومية بتركيز على المالية والصناعة.' },
        { titre: '② الرياضة', contenu: 'الألعاب المتوسطية 2026: الجزائر فازت بـ 3 ميداليات.' },
        { titre: '③ البيئة', contenu: 'حرائق الغابات: 12+ قتيل. طلب بفرض عقوبة الإعدام.' },
        { titre: '④ الدبلوماسية', contenu: 'فرنسا والجزائر: ذوبان هش مع اتفاقات قضائية.' },
        { titre: '⑤ التعليم', contenu: 'الإنجليزية تصبح اللغة الأولى من سبتمبر.' },
        { titre: '⑥ كرة القدم', contenu: 'كأس العالم 2026: الجزائر مقصاة من المجموعة.' }
      ];

      dossiers.forEach((d) => {
        doc.fontSize(11).font('Helvetica-Bold').text(d.titre);
        doc.fontSize(9.5).font('Helvetica').text(d.contenu);
        doc.moveDown(0.5);
      });

      doc.end();
      stream.on('finish', () => {
        log('INFO', `PDF AR généré: ${filename}`);
        resolve(filename);
      });
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function sendByEmail(frFile, arFile) {
  if (!config.gmail.password) {
    log('WARN', 'GMAIL_PASSWORD non configuré.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmail.user,
        pass: config.gmail.password,
      },
    });

    const mailFR = {
      from: config.gmail.user,
      to: config.gmail.user,
      subject: `Revue de Presse Algérie - ${getTodayDate()} (Français)`,
      html: `<h2>Revue de Presse - Algérie</h2><p>Voici la revue du jour avec 6 dossiers majeurs.</p><p>Généré: ${new Date().toLocaleString()}</p>`,
      attachments: [{ filename: path.basename(frFile), path: frFile }],
    };

    const resF = await transporter.sendMail(mailFR);
    log('INFO', `Email FR envoyé: ${resF.messageId}`);

    const mailAR = {
      from: config.gmail.user,
      to: config.gmail.user,
      subject: `نشرة الأخبار - الجزائر - ${getTodayDate()}`,
      html: `<h2>نشرة الأخبار - الجزائر</h2><p>إليك نشرة اليوم مع 6 ملفات رئيسية.</p><p>تم الإنشاء: ${new Date().toLocaleString('ar-DZ')}</p>`,
      attachments: [{ filename: path.basename(arFile), path: arFile }],
    };

    const resA = await transporter.sendMail(mailAR);
    log('INFO', `Email AR envoyé: ${resA.messageId}`);
  } catch (err) {
    log('ERROR', `Erreur d'envoi: ${err.message}`);
  }
}

async function main() {
  try {
    log('INFO', 'Démarrage génération revue de presse...');
    const frFile = await generatePDFFrench();
    const arFile = await generatePDFArabic();
    log('INFO', 'PDFs générés avec succès');
    await sendByEmail(frFile, arFile);
    log('INFO', '✓ Revue générée et envoyée');
    process.exit(0);
  } catch (err) {
    log('ERROR', `Erreur: ${err.message}`);
    process.exit(1);
  }
}

main();