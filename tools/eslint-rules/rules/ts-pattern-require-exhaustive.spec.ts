import { TSESLint } from '@typescript-eslint/utils';
import { rule, RULE_NAME } from './ts-pattern-require-exhaustive';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    `match(num)
      .with(P.number, () => console.log('one'))
      .with(null, () => console.log('two'))
      .exhaustive();`,
  ],
  invalid: [
    {
      code: `match(num)
        .with(P.number, () => console.log('one'))
        .with(null, () => console.log('two'));`,
      errors: [
        {
          messageId: 'requireExhaustive',
        },
      ],
      output: `match(num)
        .with(P.number, () => console.log('one'))
        .with(null, () => console.log('two'))
        .exhaustive();`,
    },
  ],
});
