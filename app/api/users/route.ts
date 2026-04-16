import { NextResponse } from "next/server";

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

export async function GET() {
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newUser = { id: users.length + 1, name: body.name };
  users.push(newUser);
  return NextResponse.json(newUser, { status: 201 });
}
