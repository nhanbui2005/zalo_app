require('dotenv').config();

export const serviceAccount = {
  type: "service_account",
  project_id: "chatproject-446807",
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), 
  client_email: "firebase-adminsdk-fbsvc@chatproject-446807.iam.gserviceaccount.com",
  client_id: "105292215063702197486",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40chatproject-446807.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

