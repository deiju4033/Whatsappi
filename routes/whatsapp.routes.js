// export default router;
import express from 'express';
import { sendMessageToAll, checkStatus, getQRCode, disconnect, uploadMiddleware, getPreviousMessages } from '../controllers/whatsapp.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';


const router = express.Router();

router.get('/status', authenticateUser, checkStatus);
router.get('/qr', authenticateUser, getQRCode);
router.post('/send-to-all', authenticateUser, uploadMiddleware, sendMessageToAll);
router.post('/disconnect', authenticateUser, disconnect);
router.get('/previous-messages', authenticateUser, getPreviousMessages);



export default router;