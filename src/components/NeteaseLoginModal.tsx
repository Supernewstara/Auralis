import React, { useState, useEffect } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getFirestore, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export const NeteaseLoginModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [qrBase64, setQrBase64] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [statusText, setStatusText] = useState('Generating QR code...');
  const [firebaseStatus, setFirebaseStatus] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setFirebaseStatus('Loading...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const db = getFirestore();
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setFirebaseStatus('Google Sign In successful!');
      setTimeout(() => {
         if (onSuccess) onSuccess();
         else onClose();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setFirebaseStatus('Error: ' + e.message);
    }
  };

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const startLoginProcess = async () => {
      try {
        const keyRes = await fetch('/api/netease/qr/key');
        const keyData = await keyRes.json();
        const unikey = keyData.data.unikey;
        setQrKey(unikey);

        const qrRes = await fetch(`/api/netease/qr/create?key=${unikey}`);
        const qrData = await qrRes.json();
        setQrBase64(qrData.data.qrimg);
        setStatusText('Waiting for scan...');

        checkInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/netease/qr/check?key=${unikey}`);
            const checkData = await checkRes.json();
            if (checkData.code === 801) {
               setStatusText('Waiting for scan...');
            } else if (checkData.code === 802) {
               setStatusText('Authorizing...');
            } else if (checkData.code === 803) {
               setStatusText('Login successful!');
               clearInterval(checkInterval);
               setTimeout(() => {
                 if (onSuccess) onSuccess();
                 else onClose();
               }, 1500);
            } else {
               setStatusText('QR code expired. Reopen modal to try again.');
               clearInterval(checkInterval);
            }
          } catch (e) {
            console.error("Netease login check error:", e);
          }
        }, 3000);
      } catch (err) {
        setStatusText('Error loading QR code');
      }
    };

    if (isOpen) {
      startLoginProcess();
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-lg"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-surface-container border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-auto shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-headline-md">
               <QrCode className="w-5 h-5" /> Netease Login
            </h3>
            <div className="flex flex-col items-center justify-center space-y-4">
               {qrBase64 ? (
                 <div className="bg-white p-2 rounded-xl">
                   <img src={qrBase64} alt="QR Code" className="w-48 h-48" />
                 </div>
               ) : (
                 <div className="w-48 h-48 flex items-center justify-center border border-white/10 rounded-xl">
                   <Loader2 className="w-8 h-8 text-primary animate-spin" />
                 </div>
               )}
               <p className="text-sm font-medium text-primary">{statusText}</p>
               <p className="text-xs text-on-surface-variant text-center leading-relaxed">Open Netease Cloud Music app and scan this code to login. This gives access to your full library without limits.</p>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-headline-md">
                 Google Sync
              </h3>
              <button onClick={handleGoogleLogin} className="w-full flex justify-center items-center gap-2 bg-white text-black py-2 rounded-xl font-semibold hover:bg-neutral-200 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.69-.35-1.43-.35-2.09s.13-1.4.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
              {firebaseStatus && <p className="text-sm text-center mt-2 text-primary">{firebaseStatus}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
