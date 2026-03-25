import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "ap-south-1" });

export const handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const fileName = body.fileName;
    const fileContent = body.fileContent;

    // 1️⃣ Check missing fields
    if (!fileName || !fileContent) {
      throw new Error("Invalid request: fileName or fileContent missing");
    }

    // 2️⃣ Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/=]+$/;

    if (!base64Regex.test(fileContent)) {
      throw new Error("Invalid base64 format");
    }

    const buffer = Buffer.from(fileContent, "base64");

    // 3️⃣ File size limit (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;

    if (buffer.length > MAX_SIZE) {
      throw new Error("File too large (Max 5MB)");
    }

    // 4️⃣ Validate file type
    const allowedTypes = ["jpg", "png", "pdf"];

    const extension = fileName.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(extension)) {
      throw new Error("Unsupported file type");
    }

    const params = {
      Bucket: "serverless-file-upload-gk",
      Key: fileName,
      Body: buffer
    };

    const command = new PutObjectCommand(params);

    await s3.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        fileName: fileName
      })
    };

  } catch (error) {

    console.error("Upload error:", error);

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error.message
      })
    };

  }

};