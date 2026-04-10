import { Link, Outlet } from "react-router-dom";
import { UserPicker } from "./UserPicker";

interface Props {
  currentUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function Layout({ currentUserId, onSelectUser }: Props) {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <h1>
            <Link to="/">Movie Theater</Link>
          </h1>
          <UserPicker currentUserId={currentUserId} onSelect={onSelectUser} />
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
