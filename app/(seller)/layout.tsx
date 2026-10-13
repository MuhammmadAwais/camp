export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">{children}</div>;
}
