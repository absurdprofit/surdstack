export enum HttpStatusCodes {
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,
  MultipleChoices = 300,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  Conflict = 409,
  UnsupportedMediaType = 415,
  DependencyFailed = 424,
  InternalServerError = 500,
  NotImplemented = 501
}

export enum LogLevel {
  Debug = 'Debug',
  Info = 'Info',
  Error = 'Error',
  Warn = 'Warn'
}


export enum Permissions {
  UserRead = 'user:read',
  UserWrite = 'user:write',
  UserAdmin = 'user:admin',
  UserDelete = 'user:delete'
}

export const PermissionDescriptions = {
  [Permissions.UserAdmin]: 'Create, update or delete users',
  [Permissions.UserDelete]: 'Delete users.',
  [Permissions.UserRead]: 'Read users.',
  [Permissions.UserWrite]: 'Create or update users.',
};

export enum CredentialTypes {
  Token = 'Token',
  Client = 'Client',
  WebAuthn = 'WebAuthn'
}

export enum Headers {
  Allow = 'Allow',
  Authorization = 'Authorization',
  TraceId = 'X-Trace-ID',
  ContentType = 'Content-Type',
  ForwardedFor = 'X-Forwarded-For',
  UserAgent = 'User-Agent',
  ResponseTime = 'X-Response-Time',
  Timestamp = 'X-Timestamp'
}

export enum ContentTypes {
  ProblemDetails = 'application/problem+json',
  Json = 'application/json',
  MultipartFormData = 'multipart/form-data',
  FormUrlEncoded = 'application/x-www-form-urlencoded'
}

export enum JwtAlgorithm {
  Es384 = 'ES384'
}

export enum JwtType {
  AccessToken = 'access_token',
  RefreshToken = 'refresh_token',
  AuthnToken = 'authn_token'
}

export enum CryptoKeyUsage {
  Verify = 'verify',
  Sign = 'sign'
}

export enum CryptoHashingAlgorithm {
  SHA512 = 'SHA-512',
  SHA256 = 'SHA-256'
}

export enum CryptoKeyFormat {
  Spki = 'spki'
}

export enum CryptoKeyAlgorithm {
  Ecdsa = 'ECDSA'
}

export enum CryptoKeyNamedCurve {
  P384 = 'P-384'
}

export enum WebAuthnPublicKeyAlgorithm {
  Ed25519 = -8,
  ES256 = -7,
  RS256 = -257,
  RS512 = -259
}

export enum WebAuthnAttestation {
  Direct = 'direct',
  Indirect = 'indirect',
  None = 'none'
}

export enum WebAuthnAuthenticatorAttachment {
  Platform = 'platform',
  CrossPlatform = 'cross-platform'
}

export enum WebAuthnAuthenticatorUserVerification {
  Required = 'required',
  Preferred = 'preferred',
  Discouraged = 'discouraged'
}

export enum RequestMethod {
  Get = 'GET',
  Delete = 'DELETE',
  Head = 'HEAD',
  Options = 'OPTIONS',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT',
  // Trace = 'TRACE',
}