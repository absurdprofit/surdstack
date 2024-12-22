import { Fido2Lib } from 'fido2-lib';
import { RELYING_PARTY_ID, RELYING_PARTY_NAME, WEB_AUTHN_CHALLENGE_SIZE, WEB_AUTHN_TIMEOUT } from '@api/common/constants.ts';
import { WebAuthnAttestation, WebAuthnAuthenticatorAttachment, WebAuthnAuthenticatorUserVerification, WebAuthnPublicKeyAlgorithm } from '@api/common/enums.ts';

export class WebAuthnService extends Fido2Lib {
  constructor() {
    super({
      timeout: WEB_AUTHN_TIMEOUT,
      rpId: RELYING_PARTY_ID,
      rpName: RELYING_PARTY_NAME,
      rpIcon: '/favicon.ico',
      challengeSize: WEB_AUTHN_CHALLENGE_SIZE,
      attestation: WebAuthnAttestation.None,
      cryptoParams: [
        // see https://www.iana.org/assignments/cose/cose.xhtml#algorithms for available algorithms
        WebAuthnPublicKeyAlgorithm.RS512,
        WebAuthnPublicKeyAlgorithm.RS256,
        WebAuthnPublicKeyAlgorithm.ES256,
      ],
      authenticatorAttachment: WebAuthnAuthenticatorAttachment.Platform,
      authenticatorRequireResidentKey: true,
      authenticatorUserVerification: WebAuthnAuthenticatorUserVerification.Preferred,
    });
  }
}