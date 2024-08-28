import express from 'express';
import { sendMessageToAll, checkStatus, getQRCode, disconnect, uploadMiddleware } from '../controllers/whatsapp.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();


router.get('/status', authenticateUser, checkStatus);
router.get('/qr', authenticateUser, getQRCode);
router.post('/send-to-all', authenticateUser, uploadMiddleware, sendMessageToAll);
router.post('/disconnect', authenticateUser, disconnect);

export default router;