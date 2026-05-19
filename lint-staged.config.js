module.exports = {
  'backend/src/**/*.ts': [
    'cd backend && npx eslint --fix',
    'cd backend && npx prettier --write',
  ],
  'modoo/src/**/*.{ts,tsx}': [
    'cd modoo && npx eslint --fix',
    'cd modoo && npx prettier --write',
  ],
  '*.{json,md,yaml,yml}': [
    'npx prettier --write',
  ],
};
