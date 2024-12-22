import { Result, FromBody, FromQuery, Inject } from '@api/internals/index.ts';
import {
  DependencyFailedError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError
} from '@api/common/errors.ts';
import type { ExpectedAttestationResult } from 'fido2-lib';
import { verifyAttestationRequest } from '@<organisation-kebab>/schema';
import * as base64url from 'base64url';
import { z } from 'zod';
import { Headers, HttpStatusCodes } from '@api/common/enums.ts';
import { hash } from '@api/common/utils.ts';
import { CHALLENGE_VALIDITY_PERIOD } from '@api/common/constants.ts';
import { WebAuthnService } from '@api/services/WebAuthnService.ts';
import AuthResource from '@api/resources/v1/auth/AuthResource.ts';
import { UaParserService } from '@api/services/UaParserService.ts';


export default class AttestationResource extends AuthResource {
  @Inject()
  declare protected readonly webAuthn: WebAuthnService;
  @Inject()
  declare protected readonly uaParser: UaParserService;

  public async PUT(@FromQuery('email', z.string().email()) email: string) {
    // check if user exists
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError(`User with email: ${email} not found`);
    const options = await this.webAuthn.attestationOptions();
    const challenge = base64url.encodeBase64Url(new Uint8Array(options.challenge));
    const credential = await this.createCredential(user.id, challenge);
    options.user = {
      name: user.name,
      displayName: user.displayName,
      id: user.id,
    };
    return Result(HttpStatusCodes.Ok, {
      credentialId: credential.id,
      publicKey: {
        ...options,
        challenge,
      },
    });
  }

  public async POST(
    @FromQuery('credentialId', z.string()) credentialId: string,
    @FromBody(z.object({ attestationResponse: verifyAttestationRequest })) clientAttestationResponse: z.infer<typeof verifyAttestationRequest>
  ) {
    const credential = await this.prisma.webAuthnCredential.findUnique({ where: { id: credentialId } });
    if (!credential)
      throw new InternalServerError('Credential not found.');
    if (!credential.challenge)
      throw new DependencyFailedError('Challenge not found');
    const attestationExpectations: ExpectedAttestationResult = {
      challenge: credential.challenge,
      origin: 'http://localhost:5174',
      factor: 'either',
    };
    try {
      const { response, id } = clientAttestationResponse;
      const registration = await this.webAuthn.attestationResult(
        { response, id: base64url.decodeBase64Url(id).buffer },
        attestationExpectations
      );
      const counter = Number(registration.authnrData.get('counter'));
      const publicKey = String(registration.authnrData.get('credentialPublicKeyPem'));
      const authenticatorCredentialId = base64url.encodeBase64Url(registration.authnrData.get('credId'));
      await this.updateCredential(credentialId, authenticatorCredentialId, publicKey, counter);
      return Result(HttpStatusCodes.Ok);
    } catch (e) {
      throw new UnauthorizedError(`Invalid attestation. error: ${e.message}`);
    }
  }

  private async updateCredential(credentialId: string, authenticatorCredentialId: string, publicKey: string, counter: number) {
    const lastUsedIP = this.connection.remote.address ?? '';
    const lastUsedUserAgent = this.request.headers.get(Headers.UserAgent) || '';
    return await this.prisma.webAuthnCredential.update({
      where: {
        id: credentialId,
      },
      data: {
        prevCounter: counter,
        authenticatorCredentialId,
        lastUsed: new Date(),
        lastUsedUserAgent,
        lastUsedIP,
        publicKey,
        challenge: null,
      },
    });
  }

  private async createCredential(userId: string, challenge: string) {
    const lastUsedIP = this.connection.remote.address ?? '';
    const lastUsedUserAgent = this.request.headers.get(Headers.UserAgent) || '';
    const challengeHash = await hash(challenge);
    const challengeExpires = new Date(Date.now() + CHALLENGE_VALIDITY_PERIOD);
    const uaParsed = this.uaParser.parse(lastUsedUserAgent);
    const defaultDeviceName = uaParsed.device.toString() ?? uaParsed.os.toString() ?? 'Unknown device';
    return await this.prisma.webAuthnCredential.create({
      data: {
        challenge,
        challengeExpires,
        challengeHash,
        lastUsed: new Date(),
        lastUsedUserAgent,
        lastUsedIP,
        deviceName: defaultDeviceName,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
}