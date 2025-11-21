module.exports = {
  env: {
    node: true,
    es2023: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "standard"
  ],
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: "module"
  },
  rules: {
    "no-console": "off",
    "strict": "off"
  }
};
