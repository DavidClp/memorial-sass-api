import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./S3Client";

export async function uploadToS3(file: any, key: string, isPublic: boolean = false) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ...(isPublic && { ACL: 'public-read' }),
    CacheControl: 'public, max-age=31536000',
  });

  await s3.send(command);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
