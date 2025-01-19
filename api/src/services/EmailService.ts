import type { JSX } from 'react';
import { renderToString } from 'react-dom/server';
import { EMAIL_FROM, RESEND_API_URL } from '@api/common/constants.ts';
import { RequestMethod, Headers, ContentTypes } from '@api/common/enums.ts';
import { Inject } from '@resourceful-hono/core';
import { EnvironmentService } from '@api/services/EnvironmentService.ts';

type EmailBody = string | JSX.Element;

class EmailBuilder {
  private subject = '';
  private recipients = new Array<string>();
  private body: EmailBody = '';

  @Inject()
  declare private readonly env: EnvironmentService;

  public get html() {
    if (typeof this.body !== 'string')
      return renderToString(this.body);
    return this.body;
  }

  public setSubject(subject: string): this {
    this.subject = subject;
    return this;
  }

  public addRecipient(recipient: string): this {
    this.recipients.push(recipient);
    return this;
  }

  public setBody(body: EmailBody): this {
    this.body = body;
    return this;
  }

  public async send() {
    if (!this.subject) {
      throw new Error('Subject is required');
    }
    if (!this.recipients.length) {
      throw new Error('At least one recipient is required');
    }
    if (!this.body) {
      throw new Error('Body is required');
    }

    const { html } = this; 
    const response = await fetch(RESEND_API_URL, {
      method: RequestMethod.Post,
      headers: {
        [Headers.ContentType]: ContentTypes.Json,
        [Headers.Authorization]: `Bearer ${this.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: this.recipients,
        subject: this.subject,
        html,
      }),
    });

    return response.ok;
  }
}

export class EmailService {
  public builder() {
    return new EmailBuilder();
  }
}