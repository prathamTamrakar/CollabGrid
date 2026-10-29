import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/utils/password.util.js';
import { createAccessToken, verifyAccessToken } from '../src/utils/token.util.js';
import { generateSecureOtp, isOtpExpired, getOtpExpirationDate } from '../src/utils/otp.util.js';
import { createUserDocument, sanitizeUser } from '../src/models/user.model.js';
import { validateRegister, validateLogin } from '../src/validators/auth.validator.js';

describe('Authentication & Security Utilities', () => {
  test('hashPassword hashes password and verifyPassword verifies correctly', async () => {
    const plain = 'StrongPass2026!';
    const hashed = await hashPassword(plain);

    assert.notEqual(plain, hashed);
    assert.equal(typeof hashed, 'string');

    const isValid = await verifyPassword(plain, hashed);
    assert.equal(isValid, true);

    const isInvalid = await verifyPassword('WrongPassword', hashed);
    assert.equal(isInvalid, false);
  });

  test('verifyPassword rejects plaintext passwords without bcrypt hash', async () => {
    const plain = 'MyPlaintextPass';
    // When stored password is raw plaintext, it must NOT match (plaintext fallback removed)
    const isPlainMatch = await verifyPassword(plain, plain);
    assert.equal(isPlainMatch, false, 'Plaintext fallback must be rejected');
  });

  test('createAccessToken generates valid JWT and verifyAccessToken decodes sub', () => {
    const userId = 'usr-123456';
    const token = createAccessToken(userId);
    assert.ok(token);

    const payload = verifyAccessToken(token);
    assert.ok(payload);
    assert.equal(payload.sub, userId);

    const invalid = verifyAccessToken('invalid.token.here');
    assert.equal(invalid, null);
  });

  test('generateSecureOtp generates cryptographically secure 6-digit numeric OTP', () => {
    const otp1 = generateSecureOtp(6);
    const otp2 = generateSecureOtp(6);

    assert.equal(otp1.length, 6);
    assert.equal(otp2.length, 6);
    assert.ok(/^\d{6}$/.test(otp1));
    assert.ok(/^\d{6}$/.test(otp2));
  });

  test('isOtpExpired correctly checks date expiration', () => {
    const future = getOtpExpirationDate(10);
    assert.equal(isOtpExpired(future), false);

    const past = new Date(Date.now() - 1000);
    assert.equal(isOtpExpired(past), true);
  });

  test('createUserDocument and sanitizeUser ensure clean user data', () => {
    const userDoc = createUserDocument({
      name: ' Alice Wonder ',
      email: ' Alice@Example.Com ',
      hashedPassword: 'hashed-secret'
    });

    assert.equal(userDoc.name, 'Alice Wonder');
    assert.equal(userDoc.email, 'alice@example.com');
    assert.ok(userDoc.id);

    const sanitized = sanitizeUser(userDoc);
    assert.equal(sanitized.id, userDoc.id);
    assert.equal(sanitized.name, 'Alice Wonder');
    assert.equal(sanitized.email, 'alice@example.com');
    assert.equal(sanitized.hashed_password, undefined);
  });

  test('validateRegister catches missing or invalid fields', () => {
    assert.ok(validateRegister({ body: {} }));
    assert.ok(validateRegister({ body: { name: 'Alice', email: 'invalid', password: '123' } }));
    assert.equal(
      validateRegister({ body: { name: 'Alice', email: 'alice@test.com', password: 'password123' } }),
      null
    );
  });

  test('validateLogin catches missing fields', () => {
    assert.ok(validateLogin({ body: {} }));
    assert.equal(
      validateLogin({ body: { email: 'alice@test.com', password: 'password123' } }),
      null
    );
  });
});
