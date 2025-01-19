import * as base64url from '@std/encoding/base64url';
import * as jwt from '@wok/djwt';
import { hash } from '@api/common/utils.ts';
import { UnauthorizedError, InternalServerError } from '@api/common/errors.ts';
import type { AccessTokenHeader, AuthnTokenHeader, RefreshTokenHeader, TokenPayload } from '@api/common/types.ts';
import { isTokenHeader, isTokenPayload, tokenHasScopeClaim } from '@api/common/types.ts';
import { Inject } from '@resourceful-hono/core';
import { CredentialTypes, CryptoHashingAlgorithm, CryptoKeyAlgorithm, CryptoKeyFormat, CryptoKeyNamedCurve, CryptoKeyUsage, JwtAlgorithm, JwtType } from '@api/common/enums.ts';
import { DEFAULT_TOKEN_NAME, JWT_TTL, RELYING_PARTY_ID } from '@api/common/constants.ts';
import { PrismaService } from '@api/services/PrismaService.ts';
import { encodedJwt } from '@<organisation-kebab>/schema';

interface Permission {
  id: string;
  resource: string;
  action: string;
}

export class OAuthService {
  @Inject()
  declare private readonly prisma: PrismaService;
  public _permissions: Map<string, Permission> | null = null;

  private async getPermissions() {
    if (!this._permissions) {
      const permissions = await this.prisma.permission.findMany();
      this._permissions = permissions.reduce((permissions, permission) => {
        const name = `${permission.resource}:${permission.action}`;
        permissions.set(name, permission);
        return permissions;
      }, new Map<string, Permission>());
    }
    return this._permissions;
  }

  public async verifyClientCredentials(clientId: string, clientSecret: string) {
    const clientCredential = await this.prisma.clientCredential.findUnique({ where: { clientId }, include: { tokenCredential: true } });
    if (clientCredential?.clientSecret !== await hash(clientSecret))
      throw new UnauthorizedError('Client id or client secret invalid');
    // TODO: figure out how to handle if token credential is null
    return { subject: clientCredential.clientId, tokenCredentialId: clientCredential.tokenCredential!.id };
  }

  public async verifyToken(token: string) {
    const tokenCredentialId = this.getTokenId(token);
    const tokenCredential = await this.prisma.tokenCredential.findUnique({ where: { id: tokenCredentialId } });
    if (!tokenCredential)
      throw new UnauthorizedError('Token credential not found');
    const publicKey = await this.importPublicKey(tokenCredential.publicKey);
    try {
      const payload = await jwt.verify(token, publicKey);
      if (!isTokenPayload(payload))
        throw new UnauthorizedError('Malformed token payload');
      // verify scope claim
      if (tokenHasScopeClaim(payload)) {
        const { sourceId, sourceType } = tokenCredential;
        const privileges = await this.getPrivilegesByCredentialId(sourceId, sourceType);
        const hasRequiredPrivileges = payload.scp.every(scope => privileges.includes(scope));
        if (!hasRequiredPrivileges)
          throw new UnauthorizedError('Insufficient privileges');
      }
      return payload;
    } catch (e) {
      const [header] = this.decodeJwt(token);
      let tokenName = DEFAULT_TOKEN_NAME;
      if (isTokenHeader(header))
        tokenName = header.typ.split('_').join(' ');
      throw new UnauthorizedError((e as Error).message.replace('jwt', tokenName));
    }
  }

  public async generateAccessToken(subject: string, tokenCredentialId: string, scope: string[]) {
    const { publicKey, privateKey } = await this.generateRSAKeyPair();
    const { sourceId, sourceType } = await this.updateTokenCredential(tokenCredentialId, await this.exportPublicKey(publicKey)) ?? {};
    const allowRefresh = await this.isTrustedSubjectTokenCredentials(sourceId, sourceType);
    const header: AccessTokenHeader = {
      alg: JwtAlgorithm.Es384,
      typ: JwtType.AccessToken,
    };
    const privileges = await this.getPrivilegesByCredentialId(sourceId, sourceType);
    const permissions = await this.getPermissions();
    scope = scope.filter(scope => privileges.includes(scope) && permissions.has(scope));
    const payload: TokenPayload = {
      iss: RELYING_PARTY_ID,
      exp: jwt.getNumericDate(JWT_TTL),
      aud: RELYING_PARTY_ID,
      sub: subject,
      iat: jwt.getNumericDate(new Date()),
      jti: tokenCredentialId,
      scp: scope,
    };
    return {
      access_token: await jwt.create(header, payload, privateKey),
      expires: payload.exp,
      scope: scope.join(' '),
      refresh_token: allowRefresh ? await this.generateRefreshToken(subject, tokenCredentialId, scope, privateKey, payload.exp) : undefined,
    };
  }

  private async generateRefreshToken(
    subject: string,
    tokenCredentialId: string,
    scope: string[],
    privateKey: CryptoKey,
    notBefore: number
  ) {
    const header: RefreshTokenHeader = {
      alg: JwtAlgorithm.Es384,
      typ: JwtType.RefreshToken,
      cid: tokenCredentialId,
    };
    const payload: TokenPayload = {
      iss: RELYING_PARTY_ID,
      exp: jwt.getNumericDate(JWT_TTL),
      aud: RELYING_PARTY_ID,
      sub: subject,
      iat: jwt.getNumericDate(new Date()),
      nbf: notBefore,
      jti: tokenCredentialId,
      scp: scope,
    };
    try {
      return await jwt.create(header, payload, privateKey);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  public async generateAuthnToken(subject: string, webAuthnCredentialId: string) {
    const { publicKey, privateKey } = await this.generateRSAKeyPair();
    const tokenCredential = await this.upsertAuthnTokenCredential(webAuthnCredentialId, await this.exportPublicKey(publicKey));
    if (!tokenCredential)
      throw new InternalServerError('There was an error generating the authn token.');
    const header: AuthnTokenHeader = {
      alg: JwtAlgorithm.Es384,
      typ: JwtType.AuthnToken,
    };
    const payload: TokenPayload = {
      iss: RELYING_PARTY_ID,
      exp: jwt.getNumericDate(JWT_TTL),
      aud: RELYING_PARTY_ID,
      sub: subject,
      iat: jwt.getNumericDate(new Date()),
      jti: tokenCredential.id,
    };
    return {
      authn_token: await jwt.create(header, payload, privateKey),
      expires: payload.exp,
    };
  }

  private async getPrivilegesByCredentialId(credentialId: string, credentialType: CredentialTypes | string) {
    let subject;
    switch (credentialType) {
      case CredentialTypes.Client:
        subject = await this.prisma.client.findFirst({
          where: {
            credential: { id: credentialId },
          },
        });
        break;
      case CredentialTypes.WebAuthn:
        subject = await this.prisma.user.findFirst({
          where: {
            credentials: { some: { id: credentialId } },
          },
        });
        break;
      default:
        throw new InternalServerError('Invalid credential type');
    }
    return subject?.privileges ?? [];
  }

  private getTokenId(token: string) {
    const [_, payload] = this.decodeJwt(token);
    if (!isTokenPayload(payload))
      throw new UnauthorizedError('Invalid token. Malformed payload.');
    return payload.jti;
  }

  private decodeJwt(token: string) {
    if (!encodedJwt.safeParse(token).success)
      throw new UnauthorizedError('Invalid token.');
    return jwt.decode(token);
  }

  private async isTrustedSubjectTokenCredentials(credentialId: string, credentialType: CredentialTypes | string) {
    switch (credentialType) {
      case CredentialTypes.Client: {
        const clientCredential = await this.prisma.clientCredential.findUnique({ where: { id: credentialId } });
        if (!clientCredential)
          throw new UnauthorizedError('Client credential not found');
        return clientCredential.trusted;
      }
      case CredentialTypes.WebAuthn: {
        const authnCredential = await this.prisma.webAuthnCredential.findUnique({ where: { id: credentialId } });
        if (!authnCredential)
          throw new UnauthorizedError('Authn credential not found');
        return authnCredential.trusted;
      }
      default:
        throw new InternalServerError('Invalid credential type');
    }
  }

  private async generateRSAKeyPair() {
    const keyPairOptions = {
      name: CryptoKeyAlgorithm.Ecdsa,
      namedCurve: CryptoKeyNamedCurve.P384,
      hash: { name: CryptoHashingAlgorithm.SHA256 }, // Use SHA-256 for hashing
    };

    // Generate the key pair
    return await crypto.subtle.generateKey(
      keyPairOptions,
      true, // Allow the keys to be extractable
      [CryptoKeyUsage.Sign, CryptoKeyUsage.Verify] // Key usage
    );
  }

  private async importPublicKey(publicKeyPem: string) {
    const [_, encodedPublicKey] = publicKeyPem.split('\n');
    return await crypto.subtle.importKey(
      CryptoKeyFormat.Spki,
      base64url.decodeBase64Url(encodedPublicKey),
      {
        name: CryptoKeyAlgorithm.Ecdsa,
        namedCurve: CryptoKeyNamedCurve.P384,
        hash: { name: CryptoHashingAlgorithm.SHA256 },
      },
      true,
      [CryptoKeyUsage.Verify]
    );
  }

  private async exportPublicKey(publicKey: CryptoKey) {
    const keyData = await crypto.subtle.exportKey(CryptoKeyFormat.Spki, publicKey);
    const keyString = base64url.encodeBase64Url(keyData);
    return `-----BEGIN PUBLIC KEY-----\n${keyString}\n-----END PUBLIC KEY-----`;
  }

  private async updateTokenCredential(tokenCredentialId: string, publicKey: string) {
    return await this.prisma.tokenCredential.update({
      where: {
        id: tokenCredentialId,
      },
      data: {
        publicKey,
      },
    });
  }

  private async upsertAuthnTokenCredential(webAuthnCredentialId: string, publicKey: string) {
    return await this.prisma.tokenCredential.upsert({
      create: {
        publicKey,
        webAuthnCredential: {
          connect: {
            id: webAuthnCredentialId,
          },
        },
      },
      update: { publicKey },
      where: {
        sourceId_sourceType: {
          sourceId: webAuthnCredentialId,
          sourceType: CredentialTypes.WebAuthn,
        },
      },
    });
  }
}