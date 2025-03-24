import * as path from 'path';
import * as admin from 'firebase-admin';
import serviceAccount from '../config/serviceAccountKey.json'; 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const messaging = admin.messaging();