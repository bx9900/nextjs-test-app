import { Suspense } from "react";

async function Greeting() {
  const res = await fetch("http://localhost:3000/api/hello", {
    cache: "no-store",
  });
  const data = await res.json();
  return <p>API says: {data.message}</p>;
}

async function UserList() {
  const res = await fetch("http://localhost:3000/api/users", {
    cache: "no-store",
  });
  const users = await res.json();
  return (
    <ul>
      {users.map((user: { id: number; name: string }) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <Suspense fallback={<p>Loading greeting...</p>}>
        <Greeting />
      </Suspense>
      <h2>Users</h2>
      <Suspense fallback={<p>Loading users...</p>}>
        <UserList />
      </Suspense>
    </div>
  );
}
