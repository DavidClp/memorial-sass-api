import { S3Client } from "@aws-sdk/client-s3";

const requiredEnvVars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[S3Client] Variável de ambiente ${key} não definida!`);
  }
});

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    "[S3Client] Variáveis AWS obrigatórias ausentes. " +
    "Defina AWS_REGION, AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY antes de iniciar o container."
  );
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default s3;
