import { verifyAssertionRequest } from '@<organisation-kebab>/schema';
import { FromBody, FromQuery, Inject, Result } from '@resourceful-hono/core';
import * as base64url from '@std/encoding/base64url';
import { z } from 'zod';
import { BadRequestError, DependencyFailedError, ForbiddenError, InternalServerError, NotFoundError, UnauthorizedError } from '@api/common/errors.ts';
import type { ExpectedAssertionResult } from 'fido2-lib';
import { Headers, HttpStatusCodes } from '@api/common/enums.ts';
import { hash } from '@api/common/utils.ts';
import { CHALLENGE_VALIDITY_PERIOD } from '@api/common/constants.ts';
import { WebAuthnService } from '@api/services/WebAuthnService.ts';
import { EmailService } from '@api/services/EmailService.ts';
import { AuthnVerification } from '@<organisation-kebab>/email';
import AuthResource from '@api/resources/v1/auth/AuthResource.ts';

export default class AssertionResource extends AuthResource {
  @Inject()
  declare protected readonly webAuthn: WebAuthnService;
  @Inject()
  declare protected readonly email: EmailService;

  public async GET(@FromQuery('challengeHash', z.string()) challengeHash: string) {
    if (challengeHash === undefined)
      throw new BadRequestError('Challenge hash is required.');

    challengeHash = decodeURIComponent(challengeHash);
    const options = await this.webAuthn.assertionOptions();
    const credential = await this.prisma.webAuthnCredential.findFirst({ where: { challengeHash } });
    if (!credential)
      throw new NotFoundError('Credential not found.');

    const { challenge, authenticatorCredentialId } = credential;
    if (authenticatorCredentialId === null)
      throw new DependencyFailedError('Authenticator credential id not found.');

    const allowCredentials: { id: string, type: 'public-key' }[] = [{
      id: authenticatorCredentialId,
      type: 'public-key',
    }];
    return Result(HttpStatusCodes.Ok, {
      publicKey: {
        ...options,
        challenge,
        allowCredentials,
      },
    });
  }

  public async PUT(@FromQuery('credentialId', z.string()) credentialId: string) {
    if (credentialId === undefined)
      throw new BadRequestError('Invalid authenticator credential id.');
    const options = await this.webAuthn.assertionOptions();
    const credential = await this.prisma.webAuthnCredential.findFirst({ where: { id: credentialId }, include: { user: true } });
    if (!credential)
      throw new DependencyFailedError('Credential not found.');
    if (!credential.authenticatorCredentialId)
      throw new DependencyFailedError('Authenticator credential id not found');
    const allowCredentials: { id: string, type: 'public-key' }[] = [{
      id: credential.authenticatorCredentialId,
      type: 'public-key',
    }];
    const challenge = base64url.encodeBase64Url(options.challenge);
    const { challengeHash } = await this.saveChallenge(credential.id, challenge) ?? {};
    if (!credential.verified) {
      const verificationLink = `http://localhost:5174/${challengeHash}`;
      this.email.builder()
        .setSubject('Login Attempt')
        .addRecipient(credential.user.email)
        .setBody(AuthnVerification({ verificationLink }))
        .send();
      return Result(HttpStatusCodes.Accepted);
    }
    return Result(HttpStatusCodes.Created, {
      publicKey: {
        ...options,
        challenge,
        allowCredentials,
      },
    });
  }

  public async POST(@FromBody(verifyAssertionRequest) clientAssertionResponse: z.infer<typeof verifyAssertionRequest>) {
    const authenticatorCredentialId = clientAssertionResponse.id;
    const credential = await this.prisma.webAuthnCredential.findFirst({ where: { authenticatorCredentialId } });
    if (!credential)
      throw new InternalServerError('Credential not found.');
    if (credential.challenge === null)
      throw new DependencyFailedError('Credential challenge not found.');
    if (credential.publicKey === null)
      throw new DependencyFailedError('Public key not found.');
    if (credential.challengeExpires && credential.challengeExpires < new Date())
      throw new ForbiddenError('Credential challenge expired.');
    const assertionExpectations: ExpectedAssertionResult = {
      challenge: credential.challenge,
      publicKey: credential.publicKey,
      origin: 'http://localhost:5174',
      factor: 'either',
      prevCounter: credential.prevCounter,
      userHandle: null,
    };
    let assertionResult;
    try {
      const { response, id } = clientAssertionResponse;
      assertionResult = await this.webAuthn.assertionResult(
        {
          response: {
            ...response,
            authenticatorData: base64url.decodeBase64Url(response.authenticatorData).buffer,
          },
          id: base64url.decodeBase64Url(id).buffer,
        },
        assertionExpectations
      );
    } catch (e) {
      throw new UnauthorizedError('Invalid assertion', { cause: e });
    }
    const counter = Number(assertionResult.authnrData.get('counter'));
    await this.updateCredential(credential.id, counter);
    const authnTokenResponse = await this.oAuth.generateAuthnToken(credential.userId, credential.id);
    return Result(HttpStatusCodes.Ok, authnTokenResponse);
  }

  private async updateCredential(webAuthnCredentialId: string, counter: number) {
    const lastUsedIP = this.connection.remote.address ?? '';
    const lastUsedUserAgent = this.request.headers.get(Headers.UserAgent) || '';
    await this.prisma.webAuthnCredential.update({
      where: {
        id: webAuthnCredentialId,
      },
      data: {
        prevCounter: counter,
        lastUsed: new Date(),
        lastUsedUserAgent,
        lastUsedIP,
        challenge: null,
        challengeHash: null,
      },
    });
  }

  private async saveChallenge(webAuthnCredentialId: string, challenge: string) {
    const challengeHash = await hash(challenge);
    const challengeExpires = new Date(Date.now() + CHALLENGE_VALIDITY_PERIOD);
    return await this.prisma.webAuthnCredential.update({
      where: {
        id: webAuthnCredentialId,
      },
      data: {
        challenge,
        challengeHash,
        challengeExpires,
      },
    });
  }
}