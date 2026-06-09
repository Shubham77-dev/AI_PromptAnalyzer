export interface UserAvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
}

const DIM: Record<NonNullable<UserAvatarProps["size"]>, { box: number; fs: number }> = {
  sm: { box: 24, fs: 9 },
  md: { box: 28, fs: 10 },
  lg: { box: 40, fs: 12 },
};

export function UserAvatar({ initials, size = "md" }: Readonly<UserAvatarProps>) {
  const d = DIM[size];
  return (
    <div
      className="flex shrink-0 items-center justify-center font-medium text-white"
      style={{
        width: d.box,
        height: d.box,
        borderRadius: 8,
        fontSize: d.fs,
        backgroundImage: "var(--pa-grad)",
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
