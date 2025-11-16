import { DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import s3 from "./S3Client";

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  await s3.send(command);
}

/**
 * Deleta todos os objetos com o prefixo especificado (ex: "memorial/slug/")
 * Útil para deletar toda a "pasta" de um memorial na S3
 */
export async function deleteAllFromPrefix(prefix: string): Promise<void> {
  const bucket = process.env.AWS_BUCKET_NAME!;
  const objectsToDelete: { Key: string }[] = [];

  // Listar todos os objetos com o prefixo
  let continuationToken: string | undefined;
  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(listCommand);
    
    if (response.Contents) {
      objectsToDelete.push(...response.Contents.map(obj => ({ Key: obj.Key! })));
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  // Deletar todos os objetos encontrados (em lotes de até 1000)
  if (objectsToDelete.length === 0) {
    return;
  }

  // S3 permite deletar até 1000 objetos por vez
  for (let i = 0; i < objectsToDelete.length; i += 1000) {
    const batch = objectsToDelete.slice(i, i + 1000);
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: batch,
      },
    });

    await s3.send(deleteCommand);
  }
}
