import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { transcribeAudio, analyzeTranscript, analyzeImage } from '../services/ai';

const router = Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Get all sessions for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const sessions = await prisma.session.findMany({
            where: { userId: req.user?.id },
            include: { actions: true },
            orderBy: { date: 'desc' },
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Single point of entry for analyzing a call
router.post('/analyze', authenticateToken, upload.single('audio'), async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'Missing audio file' });

    try {
        const filePath = req.file.path;
        const { attachments } = req.body; // JSON string of attachments metadata
        let attachmentContext = '';

        if (attachments) {
            const parsedAttachments = JSON.parse(attachments);
            for (const att of parsedAttachments) {
                if (att.type === 'photo') {
                    const description = await analyzeImage(att.content);
                    attachmentContext += `\n📷 Foto adjunta: ${description}\n`;
                } else if (att.type === 'note') {
                    attachmentContext += `\n📝 Nota: ${att.content}\n`;
                }
            }
        }

        // 1. Transcribe
        const transcript = await transcribeAudio(filePath);

        // 2. Analyze
        const analysis = await analyzeTranscript(transcript, attachmentContext);

        // 3. Save to DB
        const session = await prisma.session.create({
            data: {
                userId: req.user!.id,
                title: analysis.executive_summary.title,
                participants: analysis.executive_summary.participants,
                context: analysis.executive_summary.context,
                summary: analysis.executive_summary.summary,
                transcript: transcript,
                analysisJson: JSON.stringify(analysis),
                category: analysis.metadata.category,
                sentiment: analysis.metadata.sentiment,
                audioPath: filePath, // Currently local, Easypanel can mount a volume
                actions: {
                    create: analysis.actions.map((a: any) => ({
                        description: a.description,
                        owner: a.owner,
                        dueDate: a.due_date,
                    })),
                },
            },
            include: { actions: true },
        });

        res.json(session);
    } catch (error) {
        console.error('❌ Error Processing Recording:', error);
        res.status(500).json({
            error: (error as Error).message,
            detail: 'Fallo al transcribir o analizar la grabación'
        });
    }
});

export default router;
