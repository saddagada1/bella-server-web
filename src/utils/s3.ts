import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_REGION!,
});

export const getProductImage = async (image: string) => {
  const get_params = {
    Bucket: process.env.S3_NAME!,
    Key: image,
  };
  const get_command = new GetObjectCommand(get_params);
  const get_signed_url = await getSignedUrl(s3, get_command, { expiresIn: 3600 });

  return get_signed_url;
};

export const getProductImages = async (images: string[]) => {
  const get_params = images.map((name) => ({
    Bucket: process.env.S3_NAME!,
    Key: name,
  }));
  const get_commands = get_params.map((params) => new GetObjectCommand(params));
  const get_signed_urls = get_commands.map(
    async (command) => await getSignedUrl(s3, command, { expiresIn: 3600 })
  );
  return Promise.all(get_signed_urls);
};

export const uploadProductImages = async (image_names: string[]) => {
  const upload_params = image_names.map((name) => ({
    Bucket: process.env.S3_NAME!,
    Key: name,
  }));
  const upload_commands = upload_params.map((params) => new PutObjectCommand(params));
  const upload_signed_urls = upload_commands.map(
    async (command) => await getSignedUrl(s3, command, { expiresIn: 60 })
  );
  return Promise.all(upload_signed_urls);
};

export const deleteProductImages = async (images: string[]) => {
  const delete_params = images.map((name) => ({
    Bucket: process.env.S3_NAME!,
    Key: name,
  }));
  const delete_commands = delete_params.map((params) => new DeleteObjectCommand(params));
  const delete_images = delete_commands.map(async (command) => await s3.send(command));
  await Promise.all(delete_images);
};
