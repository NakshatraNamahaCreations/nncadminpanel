import { Client } from "basic-ftp";
import fs from "fs";
import path from "path";

const FTP_HOST = "185.206.160.126";
const FTP_USER = "u406655365.nakshatranamahacreations.com";
const FTP_PASS = "eK^bvWL6ynP0wQ7^";
const FTP_PORT = 21;
const REMOTE_DIR = "/public_html/admincrm";
const LOCAL_DIR  = "./dist";

async function upload() {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    console.log("Connecting to Hostinger FTP...");
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: FTP_PORT,
      secure: false,
    });

    console.log("Connected. Checking remote directory...");

    // Ensure remote dir exists
    await client.ensureDir(REMOTE_DIR);
    console.log(`Uploading dist/ → ${REMOTE_DIR}`);

    await client.clearWorkingDir();
    console.log("Cleared old files.");

    await client.uploadFromDir(LOCAL_DIR);
    console.log("✅ Upload complete! Site is live.");
  } catch (err) {
    console.error("❌ FTP Error:", err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

upload();
