export const CHALLENGE_VALIDITY_PERIOD = 1000 * 60 * 10; // 10 minutes in milliseconds
export const RELYING_PARTY_ID = '<organisation-kebab>';
export const RELYING_PARTY_NAME = '<organisation>';
export const JWT_TTL = 60 * 60; // 60 minutes in seconds
export const DEFAULT_TOKEN_NAME = 'token';
export const WEB_AUTHN_TIMEOUT = 1000 * 60 * 2; // 2 minutes in milliseconds
export const WEB_AUTHN_CHALLENGE_SIZE = 128;
export const DB_ID_LENGTH = 24; // mongodb hex string length (12 bytes)
export const DEFAULT_PORT = 5000;
export const RESEND_API_URL = 'https://api.resend.com/emails';
export const EMAIL_FROM = '<organisation> <noreply@<organisation-kebab>.com>';