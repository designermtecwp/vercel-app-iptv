export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black" style={{width:"100vw",height:"100dvh",overflow:"hidden"}}>
      {children}
    </div>
  );
}
