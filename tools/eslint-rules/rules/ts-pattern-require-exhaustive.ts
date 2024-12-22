/**
 * This file sets you up with structure needed for an ESLint rule.
 *
 * It leverages utilities from @typescript-eslint to allow TypeScript to
 * provide autocompletions etc for the configuration.
 *
 * Your rule's custom logic will live within the create() method below
 * and you can learn more about writing ESLint rules on the official guide:
 *
 * https://eslint.org/docs/developer-guide/working-with-rules
 *
 * You can also view many examples of existing rules here:
 *
 * https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/src/rules
 */

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

// NOTE: The rule will be available in ESLint configs as '@nx/workspace-ts-pattern-require-exhaustive'
export const RULE_NAME = 'ts-pattern-require-exhaustive';

export const rule = ESLintUtils.RuleCreator(() => __filename)({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure all match chains end with `.exhaustive()`',
      recommended: 'strict',
    },
    fixable: 'code',
    schema: [],
    messages: {
      requireExhaustive: 'All match chains must end with `.exhaustive()`.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a call to `match()`
        if (node.callee.type === 'Identifier' && node.callee.name === 'match') {
          let lastExpression: TSESTree.Node = node;

          while (
            lastExpression.parent.type === 'MemberExpression'
            || lastExpression.parent.type === 'CallExpression'
          ) {
            if (
              lastExpression.type === 'MemberExpression'
              && lastExpression.property.type === 'Identifier'
              && lastExpression.property.name === 'exhaustive'
            ) {
              break;
            }
            lastExpression = lastExpression.parent;
          }

          // Check if the last CallExpression is followed by `.exhaustive()`
          const isExhaustiveCall =
            lastExpression.type === 'MemberExpression'
            && lastExpression.property.type === 'Identifier'
            && lastExpression.property.name === 'exhaustive';

          if (isExhaustiveCall === false) {
            context.report({
              node: lastExpression,
              messageId: 'requireExhaustive',
              fix(fixer) {
                const sourceCode = context.sourceCode;
                const lastExpressionLine = sourceCode.lines[lastExpression.loc.end.line - 1];
                
                // Check if there's any line break (i.e., if the match chain is multiline)
                const isMultiline = lastExpression.loc.start.line !== lastExpression.loc.end.line;
                if (isMultiline) {
                  // Get the line's indentation
                  const indentationMatch = lastExpressionLine.match(/^(\s*)/);
                  const indentation = indentationMatch ? indentationMatch[1] : '';

                  // Add `.exhaustive()` to the end of the last call expression
                  return fixer.insertTextAfter(lastExpression, `\n${indentation}.exhaustive()`);
                } else {
                  // Add `.exhaustive()` to the end of the last call expression
                  return fixer.insertTextAfter(lastExpression, '.exhaustive()');
                }

              },
            });
          }
        }
      },
    };
  },
});
