import { Link, Outlet, useLocation } from "react-router-dom";
import { UserPicker } from "./UserPicker";

interface Props {
  currentUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function Layout({ currentUserId, onSelectUser }: Props) {
  const location = useLocation();

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-dot" />
            Marquee
            <span className="brand-mark">Movie Theater</span>
          </Link>
          <UserPicker currentUserId={currentUserId} onSelect={onSelectUser} />
        </div>
      </header>
      <main className="container">
        <div className="page-fade" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </>
  );
}
