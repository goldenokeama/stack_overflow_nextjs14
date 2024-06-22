import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <h1>Hi! from the Home page!</h1>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
