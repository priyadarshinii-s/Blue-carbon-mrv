import { Router } from 'express';
import { register, loginWallet, getMe, loginDemo } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { registerSchema, loginWalletSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login-wallet', validate(loginWalletSchema), loginWallet);

router.post('/demo-login', loginDemo);

router.get('/me', protect, getMe);

export default router;
