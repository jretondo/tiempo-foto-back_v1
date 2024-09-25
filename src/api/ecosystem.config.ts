export = {
  apps: [
    {
      name: 'P3007-club-limpieza-prod',
      script: 'dist/api/index.js',
      env: {
        PORT: 3007,
      },
    },
  ],
};
