import { Client } from "basic-ftp";

const FTP_HOST = "185.206.160.126";
const FTP_USER = "u406655365.nakshatranamahacreations.com";
const FTP_PASS = "eK^bvWL6ynP0wQ7^";
const FTP_PORT = 21;
const REMOTE_DIR = "/public_html/admincrm";

async function upload() {
  const client = new Client();
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: FTP_PORT, secure: false });
    await client.ensureDir(REMOTE_DIR);
    await client.uploadFrom("./dist/.htaccess", `${REMOTE_DIR}/.htaccess`);
    console.log("✅ .htaccess uploaded. Refresh should now work.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.close();
  }
}

upload();
