"use client";

import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useUser, { setUser } from "~/hooks/useUser";
import { signIn } from "~/lib/api/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, UserCircle } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAdmin } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? "/admin" : "/");
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const userData = await signIn({
        email: email.trim().toLowerCase(),
        password: password,
      });

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: userData.createdAt,
      });

      toast.success("Signed in successfully");

      if (userData.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      console.error("sign in error:", error);
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (type: "user" | "admin") => {
    const credentials = {
      user: { email: "mihirgrand@gmail.com", password: "12345678" },
      admin: { email: "admin@gmail.com", password: "12345678" },
    };

    const { email, password } = credentials[type];
    setEmail(email);
    setPassword(password);
    setLoading(true);

    try {
      const userData = await signIn({ email, password });

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: userData.createdAt,
      });

      toast.success(`Signed in as ${type}`);

      if (userData.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      console.error("quick login error:", error);
      toast.error(error.message || "Quick login failed. Please ensure seed data exists.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to your account
          </p>
        </div>



        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card text-muted-foreground px-2">
              Quick Access
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleQuickLogin("user")}
              disabled={loading}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              User
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleQuickLogin("admin")}
              disabled={loading}
              className="gap-2"
            >
              <UserCircle className="h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>



        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{" "}
            <a href="/sign-up" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
