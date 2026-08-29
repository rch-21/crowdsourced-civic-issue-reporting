import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { login, logout, register, requestPasswordReset, resetPassword, verifyAccount } from '../auth/service.js';

const credentials = z.object({ email: z.string().email().max(320), password: z.string().min(12).max(128) });
const registration = credentials.extend({ displayName: z.string().trim().min(2).max(160) });
const resetRequest = z.object({ email: z.string().email().max(320) });
const reset = z.object({ token: z.string().min(20), password: z.string().min(12).max(128) });
const tokenSchema = z.object({ token: z.string().min(20) });

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const input = registration.parse(request.body);
    try {
      const result = await register(input.displayName, input.email, input.password);
      return reply.code(201).send({ userId: result.userId, verificationToken: result.verificationToken });
    } catch (error: any) {
      if (error?.code === '23505') return reply.code(409).send({ error: 'ACCOUNT_EXISTS', message: 'An account with that email already exists' });
      throw error;
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = credentials.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_LOGIN_REQUEST', message: 'Enter a valid email and a password of at least 12 characters' });
    const input = parsed.data;
    try { return reply.send(await login(input.email, input.password)); }
    catch (error: any) {
      if (error?.message === 'EMAIL_NOT_VERIFIED') return reply.code(403).send({ error: error.message, message: 'Verify your account before logging in' });
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
  });

  app.post('/auth/logout', async (request, reply) => {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) await logout(header.slice(7).trim());
    return reply.code(204).send();
  });

  app.post('/auth/verify', async (request, reply) => {
    const { token } = tokenSchema.parse(request.body);
    try { await verifyAccount(token); return reply.send({ verified: true }); }
    catch { return reply.code(400).send({ error: 'INVALID_VERIFICATION_TOKEN', message: 'Verification token is invalid or expired' }); }
  });

  app.post('/auth/password-reset/request', async (request, reply) => {
    const { email } = resetRequest.parse(request.body);
    const token = await requestPasswordReset(email);
    // Delivery is intentionally not implemented; a notification service will consume this event later.
    return reply.send({ accepted: true, resetToken: process.env.NODE_ENV === 'development' ? token : undefined });
  });

  app.post('/auth/password-reset/confirm', async (request, reply) => {
    const input = reset.parse(request.body);
    try { await resetPassword(input.token, input.password); return reply.send({ reset: true }); }
    catch { return reply.code(400).send({ error: 'INVALID_RESET_TOKEN', message: 'Reset token is invalid or expired' }); }
  });
}
