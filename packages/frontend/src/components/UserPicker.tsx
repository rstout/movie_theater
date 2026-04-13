import { useUsers } from "../hooks/useUsers";

interface Props {
  currentUserId: string | null;
  onSelect: (userId: string) => void;
}

export function UserPicker({ currentUserId, onSelect }: Props) {
  const { data: users } = useUsers();

  if (!users) return null;

  return (
    <div className="user-picker">
      <label>Guest</label>
      <div className="user-picker-select">
        <select
          value={currentUserId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Select user"
        >
          {!currentUserId && <option value="">Select user…</option>}
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
