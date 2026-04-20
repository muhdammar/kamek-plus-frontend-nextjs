import { auth, signOut } from "@/auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await auth();
  const user = session!.user!;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border bg-card p-8 shadow-sm">
        {user.image && (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={80}
            height={80}
            className="rounded-full"
          />
        )}
        <div className="text-center">
          <p className="text-xl font-semibold">{user.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

