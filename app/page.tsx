import { Suspense } from "react";
import { connection } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

async function Greeting() {
  await connection();
  await delay(2000);
  return <p>API says: Hello from the API!</p>;
}

async function UserList() {
  await connection();
  await delay(4000);
  return (
    <ul>
      {users.map((user) => (
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
