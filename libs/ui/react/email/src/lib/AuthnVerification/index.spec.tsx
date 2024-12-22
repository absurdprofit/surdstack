import React from 'react';
import { render } from '@testing-library/react';

import AuthnVerification from '.';

describe('AuthnVerification', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<AuthnVerification verificationLink='#' />);
    expect(baseElement).toBeTruthy();
  });
});
