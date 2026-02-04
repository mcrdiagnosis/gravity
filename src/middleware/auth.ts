import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'gravity_super_secret_123';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
    file?: Express.Multer.File;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });

        // Check if user still exists in DB
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(401).json({ message: 'User no longer exists. Please re-login.' });

        req.user = decoded;
        next();
    });
};
