
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

console.log("API Route Module Load: Attempting to read FIREBASE_SERVICE_ACCOUNT_KEY_JSON.");
const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

if (serviceAccountJsonString && serviceAccountJsonString.trim() !== "") {
  console.log("API Route Module Load: FIREBASE_SERVICE_ACCOUNT_KEY_JSON found (first 70 chars):", serviceAccountJsonString.substring(0, 70));
} else {
  console.error("API Route Module Load: FIREBASE_SERVICE_ACCOUNT_KEY_JSON is NOT found, is empty, or contains only whitespace.");
}

if (!admin.apps.length) {
  console.log("API Route Module Init: No existing Firebase admin apps. Attempting initialization.");
  if (serviceAccountJsonString && serviceAccountJsonString.trim() !== "") {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('API Route Module Init: Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      console.error('API Route Module Init: Error during Firebase Admin SDK initialization:', error.message);
      
      console.error('API Route Module Init: Received serviceAccountJsonString that failed to parse or init (first 100 chars):', serviceAccountJsonString.substring(0, 100));
    }
  } else {
    console.warn('API Route Module Init: FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not correctly set (empty or not found).');
    console.warn('API Route Module Init: Firebase Admin SDK NOT initialized due to missing/empty service account key.');
  }
} else {
  console.log("API Route Module Init: Firebase Admin SDK already initialized.");
}


export async function POST(request: Request) {
  console.log("API Route POST handler: Entered.");

 
  if (!admin.apps.length) {
    console.error("API Route POST handler: Firebase Admin SDK is not initialized (admin.apps.length is 0). This means module-level initialization failed. Review server startup logs for messages about 'FIREBASE_SERVICE_ACCOUNT_KEY_JSON' and any initialization errors.");
    return NextResponse.json({ success: false, error: 'Server configuration error: Firebase Admin SDK failed to initialize. Please check server logs for more details.' }, { status: 500 });
  }
  console.log("API Route POST handler: Firebase Admin SDK appears to be initialized (admin.apps.length > 0).");

  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Email and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    console.log(`API Route POST handler: Attempting password reset for email: ${email}`);

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`API Route POST handler: User found with UID: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.warn(`API Route POST handler: User not found for email: ${email}`);
        return NextResponse.json({ success: false, error: 'User with this email not found.' }, { status: 404 });
      }
      console.error('API Route POST handler: Error fetching user by email:', error);
      return NextResponse.json({ success: false, error: 'Error finding user account. ' + (error.message || '') }, { status: 500 });
    }

    try {
      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword,
      });
      console.log(`API Route POST handler: Password updated successfully for user: ${email} (UID: ${userRecord.uid})`);
      return NextResponse.json({ success: true, message: 'Password updated successfully.' });
    } catch (error: any) {
      console.error(`API Route POST handler: Error updating password for UID ${userRecord.uid}:`, error);
      return NextResponse.json({ success: false, error: 'Failed to update password. ' + (error.message || '') }, { status: 500 });
    }

  } catch (error: any)
   {
    console.error('API Route POST handler: General error in /api/admin-password-reset:', error);
    
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ success: false, error: 'Invalid request format. Expected JSON.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
