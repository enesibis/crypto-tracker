export default function IbisPulseLogo() {
  return (
    <div className="logo-enter flex flex-col items-start">
      <img
        src="/logo.png.png"
        alt="IbisPulse"
        height={75}
        style={{ objectFit: 'contain', width: 'auto', maxHeight: 75 }}
      />
      <p className="text-xs tracking-[0.2em] uppercase mt-1 font-medium" style={{
        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Live Crypto Market Tracking
      </p>
    </div>
  );
}
