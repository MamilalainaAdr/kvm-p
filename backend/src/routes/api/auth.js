import express from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, logout, verifyEmail, me } from '../../controllers/auth.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.post('/register',
  body('name').trim().isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  validate,
  register
);

router.get('/verify-email', verifyEmail);

router.post('/login',
  body('email').isEmail(),
  body('password').exists(),
  validate,
  login
);

router.post('/logout', logout);

router.get('/me', requireAuth, me);

export default router;