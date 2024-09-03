import express from 'express';
import { addContact, deleteContact, updateContact, getContacts, uploadContacts } from '../controllers/contact.controllers.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/createContact', authenticateUser, addContact);
router.delete('/deleteContact/:id', authenticateUser, deleteContact);
router.put('/updateContact/:id', authenticateUser, updateContact);
router.get('/getContact/:companyId', authenticateUser, getContacts);
router.post('/uploadContacts', authenticateUser, upload.single('file'), uploadContacts);


export default router;