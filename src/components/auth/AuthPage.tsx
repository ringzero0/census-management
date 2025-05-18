
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { useAuth } from '@/contexts/auth-context';
import { AuthPageFormSchema, type AuthPageFormValues, type LoginFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

import './AuthPage.css'; 

const AuthPage = () => {
  const [activePanel, setActivePanel] = useState<'executive' | 'admin'>('executive');
  const { login, authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const executiveForm = useForm<AuthPageFormValues>({
    resolver: zodResolver(AuthPageFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const adminForm = useForm<AuthPageFormValues>({
    resolver: zodResolver(AuthPageFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (data: AuthPageFormValues, role: 'admin' | 'executive') => {
    const loginData: LoginFormValues = { ...data, role };
    const result = await login(loginData);

    if (result.success) {
      toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
      router.push(role === "admin" ? "/admin/dashboard" : "/executive/dashboard");
    } else {
      let description = "An unexpected error occurred. Please try again.";
      switch (result.error) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          description = "The email or password you entered is incorrect. Please double-check and try again.";
          break;
        case 'role_mismatch':
          description = "Login successful, but the selected role does not match your account's role.";
          break;
        case 'profile_not_found':
          description = "Your user profile could not be found. Please contact support.";
          break;
        case 'auth/user-disabled':
          description = "This user account has been disabled. Please contact support.";
          break;
        case 'login_failed':
        default:
          description = result.error || "Invalid credentials or role. Please try again.";
          break;
      }
      toast({
        title: "Login Failed",
        description: description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="background-circles">
        <div className="circle"></div>
        <div className="circle"></div>
        <div className="circle"></div>
      </div>
      <div className="auth-page-title">CensusWise</div>

      <div className={`auth-container ${activePanel === 'admin' ? 'admin-panel-active' : 'executive-panel-active'}`}>
        {/* Panel for Admin Login & Sketchfab Model */}
        <div className="auth-panel admin-panel">
          <div className="panel-content-wrapper">
            <h2>Admin Hub</h2>
            <p className="panel-description">Access the administrative dashboard and system overview.</p>
            <div className="sketchfab-embed-wrapper">
              <iframe 
                title="DEC VT220 Computer Terminal" 
                frameBorder="0" 
                allowFullScreen 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                src="https://sketchfab.com/models/830cb4eed93747119ac297168cd774c2/embed?autostart=1&preload=1&transparent=1&ui_hint=0"
                style={{ width: '100%', height: '250px', border: 'none', borderRadius: '8px' }}
                data-ai-hint="computer terminal"
              > 
              </iframe> 
              <p style={{ fontSize: '10px', fontWeight: 'normal', margin: '5px 0 0 0', color: '#FFFFFF90', textAlign: 'center' }}> 
                <a href="https://sketchfab.com/3d-models/dec-vt220-computer-terminal-830cb4eed93747119ac297168cd774c2?utm_medium=embed&utm_campaign=share-popup&utm_content=830cb4eed93747119ac297168cd774c2" target="_blank" rel="nofollow noreferrer" style={{ fontWeight: 'bold', color: '#ADD8E6' }}> DEC VT220 Computer Terminal </a> 
                by <a href="https://sketchfab.com/dr.badass2142?utm_medium=embed&utm_campaign=share-popup&utm_content=830cb4eed93747119ac297168cd774c2" target="_blank" rel="nofollow noreferrer" style={{ fontWeight: 'bold', color: '#ADD8E6' }}> Brandon Westlake </a> 
                on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=830cb4eed93747119ac297168cd774c2" target="_blank" rel="nofollow noreferrer" style={{ fontWeight: 'bold', color: '#ADD8E6' }}>Sketchfab</a>
              </p>
            </div>
            <form onSubmit={adminForm.handleSubmit(data => handleLogin(data, 'admin'))} className="auth-form">
              <input type="email" placeholder="Admin Email" {...adminForm.register("email")} />
              {adminForm.formState.errors.email && <p className="form-field-error">{adminForm.formState.errors.email.message}</p>}
              <input type="password" placeholder="Password" {...adminForm.register("password")} />
              {adminForm.formState.errors.password && <p className="form-field-error">{adminForm.formState.errors.password.message}</p>}
              <button type="submit" className="btn-submit" disabled={authLoading || adminForm.formState.isSubmitting}>
                {authLoading || adminForm.formState.isSubmitting ? "Signing In..." : "Admin Sign In"}
              </button>
            </form>
            <button onClick={() => setActivePanel('executive')} className="btn-toggle-panel">
              Switch to Executive Login
            </button>
          </div>
        </div>

        
        <div className="auth-panel executive-panel">
          <div className="panel-content-wrapper">
            <h2>Executive Login</h2>
            <p className="panel-description">Access your census data entry and management tools.</p>
            <div className="sketchfab-embed-wrapper">
              <iframe 
                title="Low-Fi Retro Computer" 
                frameBorder="0" 
                allowFullScreen 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                src="https://sketchfab.com/models/0688b803e3d741798bbd261c14b209b1/embed?autostart=1&preload=1&transparent=1&ui_hint=0"
                style={{ width: '100%', height: '220px', border: 'none', borderRadius: '8px' }}
                data-ai-hint="retro computer"
              > 
              </iframe> 
              <p style={{ fontSize: '10px', fontWeight: 'normal', margin: '5px 0 0 0', color: '#333333', textAlign: 'center' }}> 
                <a href="https://sketchfab.com/3d-models/low-fi-retro-computer-0688b803e3d741798bbd261c14b209b1?utm_medium=embed&utm_campaign=share-popup&utm_content=0688b803e3d741798bbd261c14b209b1" target="_blank" rel="nofollow noreferrer" style={{ fontWeight: 'bold', color: '#007bff' }}> Low-Fi Retro Computer </a> 
                by <a href="https://sketchfab.com/bevanmckechnie?utm_medium=embed&utm_campaign=share-popup&utm_content=0688b803e3d741798bbd261c14b209b1" target="_blank" rel="nofollow noreferrer" style={{ fontWeight: 'bold', color: '#007bff' }}> NotDead </a> 
                on <a href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=0688b803e3d741798bbd261c14b209b1" target="_blank" rel="nofollow noreferrer" style={{ fontWeight: 'bold', color: '#007bff' }}>Sketchfab</a>
              </p>
            </div>
            <form onSubmit={executiveForm.handleSubmit(data => handleLogin(data, 'executive'))} className="auth-form">
              <input type="email" placeholder="Executive Email" {...executiveForm.register("email")} />
              {executiveForm.formState.errors.email && <p className="form-field-error">{executiveForm.formState.errors.email.message}</p>}
              <input type="password" placeholder="Password" {...executiveForm.register("password")} />
              {executiveForm.formState.errors.password && <p className="form-field-error">{executiveForm.formState.errors.password.message}</p>}
              <button type="submit" className="btn-submit" disabled={authLoading || executiveForm.formState.isSubmitting}>
                {authLoading || executiveForm.formState.isSubmitting ? "Signing In..." : "Executive Sign In"}
              </button>
            </form>
            <Link href="/forgot-password/request-otp" legacyBehavior>
              <a className="forgot-password-link">Forgot Password?</a>
            </Link>
            <button onClick={() => setActivePanel('admin')} className="btn-toggle-panel">
              Switch to Admin View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
