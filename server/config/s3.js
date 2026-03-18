import { S3Client } from '@aws-sdk/client-s3';

// When running on EC2 with an IAM role attached, the AWS SDK automatically
// fetches credentials from the instance metadata service (IMDS).
// No explicit credentials needed — just the region.
const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

export const BUCKET = process.env.AWS_BUCKET_NAME;
export default s3;
