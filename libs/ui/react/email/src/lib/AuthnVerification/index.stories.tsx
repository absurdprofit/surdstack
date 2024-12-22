import type { Meta, StoryObj } from '@storybook/react';
import { AuthnVerification } from './index';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<typeof AuthnVerification> = {
  component: AuthnVerification,
  title: 'AuthnVerification',
};
export default meta;
type Story = StoryObj<typeof AuthnVerification>;

export const Primary: Story = {
  args: {
    verificationLink: '#',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/Click here to log in with this magic link/gi)).toBeTruthy();
  },
};
