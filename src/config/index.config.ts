export default () => ({
  port: process.env.PORT || 3000,
  db: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: '5m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    },
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_OR_ROUNDS),
  rateLimit: {
    max: Number(process.env.THROTTLER_REQ_LIMIT),
    duration: Number(process.env.THROTTLER_TTL_SECS),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  s3: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_S3_REGION,
  },
});
