export const config = {
  'username': process.env.POSTGRES_USERNAME,
  'password': process.env.POSTGRES_PASSWORD,
  'database': process.env.POSTGRES_DB,
  'host': process.env.POSTGRES_HOST,
  'dialect': 'postgres',
  'aws_region': process.env.AWS_DEFAULT_REGION,
  'aws_media_bucket': process.env.AWS_BUCKET,
  'url': process.env.ALLOW_REQUESTS_FROM_URL,
  'jwt': {
    'secret': process.env.JWT_SECRET,
  },
};
