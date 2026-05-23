'use client'

import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/context/auth-context'
import { ArrowLeft } from 'lucide-react'

type Step = 'credentials' | 'otp' | 'change_password'

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

function HRIllustration() {
  return (
    <svg viewBox="0 0 360 340" width="100%" style={{ maxWidth: 360 }} xmlns="http://www.w3.org/2000/svg">
      {/* Ambient rings */}
      <circle cx="180" cy="170" r="130" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <circle cx="180" cy="170" r="100" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

      {/* ── Desk ── */}
      <rect x="85" y="196" width="190" height="10" rx="5" fill="#1A56DB" opacity="0.9"/>
      <rect x="95" y="206" width="170" height="60" rx="4" fill="#0F3A87" opacity="0.8"/>
      <rect x="108" y="262" width="10" height="28" rx="3" fill="#0B2E6B"/>
      <rect x="242" y="262" width="10" height="28" rx="3" fill="#0B2E6B"/>

      {/* ── Monitor ── */}
      <rect x="145" y="148" width="70" height="52" rx="5" fill="#0D2352" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <rect x="149" y="152" width="62" height="40" rx="3" fill="#1565C0"/>
      {/* screen ui */}
      <rect x="152" y="155" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.6)"/>
      <rect x="152" y="161" width="12" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="167" y="161" width="10" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="152" y="166" width="56" height="1" rx="0.5" fill="rgba(255,255,255,0.12)"/>
      {/* bar chart */}
      {[
        [153, 177, 10, '#4F8EF7'],
        [160, 172, 15, '#0E9F6E'],
        [167, 175, 12, '#4F8EF7'],
        [174, 169, 18, '#0E9F6E'],
        [181, 173, 14, '#F6AD55'],
        [188, 170, 17, '#4F8EF7'],
        [195, 175, 12, '#0E9F6E'],
      ].map(([x, y, h, fill], i) => (
        <rect key={i} x={x as number} y={y as number} width="5" height={h as number} rx="1" fill={fill as string} opacity="0.9"/>
      ))}
      {/* stand */}
      <rect x="175" y="200" width="10" height="6" rx="1" fill="#0B2E6B"/>
      <rect x="169" y="204" width="22" height="3" rx="1.5" fill="#0B2E6B"/>

      {/* ── Person ── */}
      <rect x="167" y="218" width="26" height="40" rx="4" fill="#1341B0" opacity="0.6"/>
      <rect x="172" y="230" width="16" height="24" rx="4" fill="#EFD0B0"/>
      <rect x="172" y="235" width="16" height="19" rx="3" fill="#4F8EF7"/>
      <ellipse cx="180" cy="225" rx="10" ry="11" fill="#EFD0B0"/>
      <ellipse cx="180" cy="215" rx="10" ry="6" fill="#2D1A0E"/>
      <rect x="170" y="215" width="20" height="8" fill="#2D1A0E"/>
      <path d="M174 236 L180 242 L186 236" fill="none" stroke="white" strokeWidth="1.2"/>

      {/* ── Card: Leave Request ── */}
      <g transform="translate(22, 60)">
        <rect width="92" height="64" rx="10" fill="white" opacity="0.96"/>
        <rect x="0" y="0" width="92" height="10" rx="10" fill="#1A56DB" opacity="0.9"/>
        <rect x="0" y="6" width="92" height="4" fill="#1A56DB" opacity="0.9"/>
        <text x="6" y="8" fontSize="5.5" fill="white" fontFamily="system-ui, sans-serif" fontWeight="600">Leave Request</text>
        <rect x="6" y="14" width="34" height="8" rx="4" fill="#D1FAE5"/>
        <text x="12" y="20" fontSize="5" fill="#065F46" fontFamily="system-ui, sans-serif">● Approved</text>
        {[0,1,2,3,4,5,6].map((i) => (
          <rect key={i} x={6 + i * 8} y="26" width="6" height="6" rx="1" fill={i >= 2 && i <= 4 ? '#1A56DB' : '#DBEAFE'}/>
        ))}
        <text x="6" y="50" fontSize="5" fill="#374151" fontFamily="system-ui, sans-serif">5 days · Annual leave</text>
        <rect x="6" y="54" width="50" height="6" rx="3" fill="#EBF2FF"/>
        <rect x="6" y="54" width="35" height="6" rx="3" fill="#1A56DB" opacity="0.8"/>
      </g>
      <line x1="114" y1="112" x2="158" y2="160" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3"/>

      {/* ── Card: Attendance ── */}
      <g transform="translate(248, 48)">
        <rect width="96" height="72" rx="10" fill="white" opacity="0.96"/>
        <rect x="0" y="0" width="96" height="10" rx="10" fill="#0E9F6E" opacity="0.9"/>
        <rect x="0" y="6" width="96" height="4" fill="#0E9F6E" opacity="0.9"/>
        <text x="6" y="8" fontSize="5.5" fill="white" fontFamily="system-ui, sans-serif" fontWeight="600">Team Attendance</text>
        {[['OT','#FEE2E2','#991B1B',14],['AK','#DBEAFE','#1E40AF',26],['SG','#D1FAE5','#065F46',38],['NB','#FEF3C7','#92400E',50]].map(([initials,bg,color,cx]) => (
          <g key={initials as string}>
            <circle cx={cx as number} cy="22" r="7" fill={bg as string}/>
            <text x={cx as number} y="25.5" fontSize="6" fill={color as string} textAnchor="middle" fontFamily="system-ui, sans-serif">{initials}</text>
          </g>
        ))}
        {[[76,'#0E9F6E'],[60,'#F6AD55'],[70,'#0E9F6E']].map(([w,fill],i) => (
          <g key={i}>
            <rect x="6" y={34+i*7} width="80" height="4" rx="2" fill="#E3E8F0"/>
            <rect x="6" y={34+i*7} width={w as number} height="4" rx="2" fill={fill as string} opacity="0.85"/>
          </g>
        ))}
        <text x="6" y="65" fontSize="5" fill="#374151" fontFamily="system-ui, sans-serif">95% on-time · Today</text>
      </g>
      <line x1="248" y1="100" x2="210" y2="160" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3"/>

      {/* ── Card: Payslip ── */}
      <g transform="translate(14, 220)">
        <rect width="88" height="62" rx="10" fill="white" opacity="0.96"/>
        <rect x="0" y="0" width="88" height="10" rx="10" fill="#7C5CFC" opacity="0.9"/>
        <rect x="0" y="6" width="88" height="4" fill="#7C5CFC" opacity="0.9"/>
        <text x="6" y="8" fontSize="5.5" fill="white" fontFamily="system-ui, sans-serif" fontWeight="600">Payslip · May 2026</text>
        <text x="6" y="22" fontSize="5" fill="#6B7280" fontFamily="system-ui, sans-serif">Base salary</text>
        <text x="82" y="22" fontSize="5.5" fill="#111827" textAnchor="end" fontFamily="system-ui, sans-serif" fontWeight="600">3 800 TND</text>
        <text x="6" y="31" fontSize="5" fill="#6B7280" fontFamily="system-ui, sans-serif">Bonuses</text>
        <text x="82" y="31" fontSize="5.5" fill="#0E9F6E" textAnchor="end" fontFamily="system-ui, sans-serif">+320 TND</text>
        <text x="6" y="40" fontSize="5" fill="#6B7280" fontFamily="system-ui, sans-serif">Tax</text>
        <text x="82" y="40" fontSize="5.5" fill="#E3715B" textAnchor="end" fontFamily="system-ui, sans-serif">-760 TND</text>
        <line x1="6" y1="44" x2="82" y2="44" stroke="#E5E7EB" strokeWidth="0.5"/>
        <text x="6" y="54" fontSize="5.5" fill="#111827" fontFamily="system-ui, sans-serif" fontWeight="700">Net pay</text>
        <text x="82" y="54" fontSize="6" fill="#7C5CFC" textAnchor="end" fontFamily="system-ui, sans-serif" fontWeight="700">3 360 TND</text>
      </g>
      <line x1="102" y1="225" x2="160" y2="210" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3"/>

      {/* ── Card: New Hire ── */}
      <g transform="translate(260, 216)">
        <rect width="86" height="66" rx="10" fill="white" opacity="0.96"/>
        <rect x="0" y="0" width="86" height="10" rx="10" fill="#E3715B" opacity="0.9"/>
        <rect x="0" y="6" width="86" height="4" fill="#E3715B" opacity="0.9"/>
        <text x="6" y="8" fontSize="5.5" fill="white" fontFamily="system-ui, sans-serif" fontWeight="600">New Hire · Onboarding</text>
        <circle cx="20" cy="26" r="9" fill="#FEF3C7"/>
        <text x="20" y="29.5" fontSize="7.5" fill="#92400E" textAnchor="middle" fontFamily="system-ui, sans-serif">AL</text>
        <text x="34" y="22" fontSize="5.5" fill="#111827" fontFamily="system-ui, sans-serif" fontWeight="600">Amira Labidi</text>
        <text x="34" y="30" fontSize="5" fill="#6B7280" fontFamily="system-ui, sans-serif">UX Designer</text>
        <text x="8" y="44" fontSize="5" fill="#0E9F6E" fontFamily="system-ui, sans-serif">✓ Contract signed</text>
        <text x="8" y="52" fontSize="5" fill="#0E9F6E" fontFamily="system-ui, sans-serif">✓ IT access granted</text>
        <text x="8" y="60" fontSize="5" fill="#6B7280" fontFamily="system-ui, sans-serif">○ Orientation session</text>
      </g>
      <line x1="260" y1="230" x2="215" y2="210" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3"/>

      {/* ── Notification bubble ── */}
      <g transform="translate(140, 30)">
        <rect width="80" height="22" rx="11" fill="#1A56DB" opacity="0.92"/>
        <circle cx="11" cy="11" r="7" fill="rgba(255,255,255,0.25)"/>
        <text x="11" y="14.5" fontSize="8" textAnchor="middle" fontFamily="system-ui, sans-serif" fill="white">🔔</text>
        <text x="23" y="15" fontSize="6" fill="white" fontFamily="system-ui, sans-serif">3 pending tasks</text>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function LoginPage() {
  const {
    login,
    verifyLoginOtp,
    completeFirstLogin,
    loginAsDemo,
    isLoading,
    error,
  } = useContext(AuthContext)

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('nada.br@intraconnect.com')
  const [password, setPassword] = useState('demo123')
  const [otp, setOtp] = useState('')
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)

  useEffect(() => {
    if (step !== 'otp' || !expiresAt) return
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setCountdown(remaining)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [step, expiresAt])

  const resetToStart = () => {
    setStep('credentials')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setChallengeToken(null)
    setExpiresAt(null)
    setLocalError(null)
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    try {
      const outcome = await login(email, password)
      if (outcome.kind === 'otp_required') {
        setChallengeToken(outcome.challengeToken)
        setExpiresAt(outcome.expiresAt)
        setStep('otp')
      } else if (outcome.kind === 'password_change_required') {
        setStep('change_password')
      }
    } catch { /* error surfaced via context */ }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!challengeToken) return
    try {
      await verifyLoginOtp(challengeToken, otp.trim())
    } catch { /* error surfaced via context */ }
  }

  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (newPassword.length < 8) { setLocalError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setLocalError('Passwords do not match.'); return }
    try {
      await completeFirstLogin(email, otp.trim(), newPassword)
    } catch { /* error surfaced via context */ }
  }

  const displayError = localError || error

  const stepTitles: Record<Step, string> = {
    credentials: 'Welcome back',
    otp: "Verify it's you",
    change_password: 'Set your password',
  }

  const stepSubs: Record<Step, string> = {
    credentials: 'Sign in to access Intranet — your secure HR portal.',
    otp: `We sent a 6-digit code to ${email}. Expires in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}.`,
    change_password: 'First-time login. Enter the OTP from HR and choose a new password.',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .hr-login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* ── LEFT PANEL ── */
        .hr-left {
          background: linear-gradient(160deg, #0F1B4C 0%, #1A3A8F 50%, #0D5C4E 100%);
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .hr-left::before {
          content: '';
          position: absolute;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(26,86,219,0.25) 0%, transparent 70%);
          top: -80px; left: -80px; border-radius: 50%;
        }
        .hr-left::after {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(14,159,110,0.2) 0%, transparent 70%);
          bottom: 40px; right: -60px; border-radius: 50%;
        }

        .hr-logo { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
        .hr-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #4F8EF7 0%, #1A56DB 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .hr-logo-text { font-family: 'DM Serif Display', Georgia, serif; font-size: 22px; color: #fff; }

        .hr-illustration { position: relative; z-index: 1; flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 0; }

        .hr-copy { position: relative; z-index: 1; }
        .hr-copy h1 { font-family: 'DM Serif Display', Georgia, serif; font-size: 30px; color: #fff; line-height: 1.25; margin-bottom: 12px; }
        .hr-copy p { font-size: 13.5px; color: rgba(255,255,255,0.65); line-height: 1.65; max-width: 340px; margin-bottom: 24px; }

        .hr-pills { display: flex; flex-direction: column; gap: 10px; }
        .hr-pill {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 50px; padding: 8px 14px;
          width: fit-content; font-size: 12px; color: rgba(255,255,255,0.85);
        }
        .hr-pill-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* ── RIGHT PANEL ── */
        .hr-right {
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 32px;
        }
        .hr-form-card { width: 100%; max-width: 400px; }

        .hr-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: #EBF2FF; color: #1A56DB;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 5px 12px; border-radius: 50px; margin-bottom: 20px;
        }
        .hr-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #1A56DB; animation: hrPulse 2s ease infinite; }
        @keyframes hrPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .hr-form-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 30px; color: #111827; margin-bottom: 6px; line-height: 1.2; }
        .hr-form-sub { font-size: 13.5px; color: #6B7280; margin-bottom: 32px; line-height: 1.5; }

        .hr-back-btn {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 13px; color: #6B7280; background: none; border: none;
          cursor: pointer; padding: 0; margin-bottom: 20px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .hr-back-btn:hover { color: #111827; }

        .hr-field { margin-bottom: 16px; }
        .hr-label { font-size: 12.5px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }

        .hr-input-wrap { position: relative; }
        .hr-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; pointer-events: none; display: flex; }

        .hr-input {
          width: 100%; padding: 11px 12px 11px 38px;
          border: 1.5px solid #D1D5DB; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; color: #111827;
          background: #F8FAFF; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hr-input:focus { border-color: #1A56DB; box-shadow: 0 0 0 3px rgba(26,86,219,0.1); background: #fff; }

        .hr-input-otp {
          width: 100%; padding: 16px 12px;
          border: 1.5px solid #D1D5DB; border-radius: 8px;
          font-family: 'DM Serif Display', Georgia, serif; font-size: 28px;
          color: #111827; letter-spacing: 0.5em; text-align: center;
          background: #F8FAFF; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hr-input-otp:focus { border-color: #1A56DB; box-shadow: 0 0 0 3px rgba(26,86,219,0.1); background: #fff; }

        .hr-btn-primary {
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #1A56DB 0%, #1341B0 100%);
          color: #fff; border: none; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; letter-spacing: 0.01em; margin-top: 8px;
          box-shadow: 0 4px 14px rgba(26,86,219,0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .hr-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,86,219,0.4); }
        .hr-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .hr-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .hr-divider-line { flex: 1; height: 1px; background: #D1D5DB; }
        .hr-divider-text { font-size: 11px; color: #9CA3AF; font-weight: 500; white-space: nowrap; }

        .hr-btn-demo {
          width: 100%; padding: 11px;
          background: #fff; color: #374151;
          border: 1.5px solid #D1D5DB; border-radius: 8px;
          font-family: 'DM Sans', system-ui, sans-serif; font-size: 13.5px; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s, border-color 0.15s;
        }
        .hr-btn-demo:hover { background: #F3F4F6; border-color: #6B7280; }

        .hr-error {
          background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B;
          font-size: 13px; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
        }

        .hr-expired { font-size: 12px; color: #DC2626; text-align: center; margin-top: 8px; }

        .hr-demo-box {
          margin-top: 22px; padding: 14px;
          background: #F3F4F6; border-radius: 8px; border: 1px solid #D1D5DB;
        }
        .hr-demo-title { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .hr-demo-row {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 0; border-bottom: 1px solid #D1D5DB;
        }
        .hr-demo-row:last-child { border-bottom: none; }
        .hr-badge {
          font-size: 10px; font-weight: 700; padding: 2px 7px;
          border-radius: 50px; white-space: nowrap; flex-shrink: 0;
        }
        .hr-badge-admin    { background: #FEE2E2; color: #991B1B; }
        .hr-badge-manager  { background: #FEF3C7; color: #92400E; }
        .hr-badge-hr       { background: #DBEAFE; color: #1E40AF; }
        .hr-badge-employee { background: #D1FAE5; color: #065F46; }
        .hr-demo-email { font-size: 11px; font-family: monospace; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        @media (max-width: 700px) {
          .hr-login-page { grid-template-columns: 1fr; }
          .hr-left { display: none; }
          .hr-right { padding: 28px 20px; min-height: 100vh; }
        }
      `}</style>

      <div className="hr-login-page">

        {/* ── LEFT: brand + illustration ── */}
        <div className="hr-left">
          <div className="hr-logo">
            <div className="hr-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </div>
            <span className="hr-logo-text">Intranet</span>
          </div>

          <div className="hr-illustration">
            <HRIllustration />
          </div>

          <div className="hr-copy">
            <h1>Your HR workspace,<br /><em>all in one place.</em></h1>
            <p>Leaves, payroll, attendance, help desk and onboarding — every workflow secured and audited.</p>
            {/* <div className="hr-pills">
              {[
                { color: '#0E9F6E', label: 'OTP-secured two-factor login' },
                { color: '#F6AD55', label: 'Role-based access · 4 levels' },
                { color: '#7C5CFC', label: 'Immutable audit trail on every action' },
              ].map(({ color, label }) => (
                <div className="hr-pill" key={label}>
                  <span className="hr-pill-dot" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div> */}
          </div>
        </div>

        {/* ── RIGHT: form ── */}
        <div className="hr-right">
          <div className="hr-form-card">

            {step !== 'credentials' && (
              <button className="hr-back-btn" type="button" onClick={resetToStart}>
                <ArrowLeft size={14} /> Back to sign-in
              </button>
            )}

            {/* <div className="hr-eyebrow">
              <span className="hr-eyebrow-dot" />
              Phase-1 demo · {new Date().getFullYear()}
            </div> */}

            <h2 className="hr-form-title">{stepTitles[step]}</h2>
            <p className="hr-form-sub">{stepSubs[step]}</p>

            {displayError && <div className="hr-error">{displayError}</div>}

            {/* ── Credentials step ── */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit}>
                <div className="hr-field">
                  <label className="hr-label">Email address</label>
                  <div className="hr-input-wrap">
                    <span className="hr-input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 7l10 7 10-7"/></svg>
                    </span>
                    <input className="hr-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@intraconnect.com" disabled={isLoading} required />
                  </div>
                </div>

                <div className="hr-field">
                  <label className="hr-label">Password</label>
                  <div className="hr-input-wrap">
                    <span className="hr-input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                    </span>
                    <input className="hr-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" disabled={isLoading} required />
                  </div>
                </div>

                <button className="hr-btn-primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Signing in…' : 'Continue →'}
                </button> 
              </form>
            )}

            {/* ── OTP step ── */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit}>
                <div className="hr-field">
                  <label className="hr-label">6-digit code</label>
                  <input
                    className="hr-input-otp"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    required
                    autoFocus
                  />
                </div>
                <button className="hr-btn-primary" type="submit" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? 'Verifying…' : 'Verify & sign in'}
                </button>
                {countdown === 0 && <p className="hr-expired">Code expired — please restart sign-in.</p>}
              </form>
            )}

            {/* ── Change password step ── */}
            {step === 'change_password' && (
              <form onSubmit={handleFirstLoginSubmit}>
                <div className="hr-field">
                  <label className="hr-label">Activation OTP</label>
                  <input className="hr-input" style={{ paddingLeft: 12 }} value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP from HR" required autoFocus />
                </div>
                <div className="hr-field">
                  <label className="hr-label">New password</label>
                  <input className="hr-input" style={{ paddingLeft: 12 }} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" required />
                </div>
                <div className="hr-field">
                  <label className="hr-label">Confirm password</label>
                  <input className="hr-input" style={{ paddingLeft: 12 }} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
                </div>
                <button className="hr-btn-primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Activating…' : 'Activate account'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  )
}