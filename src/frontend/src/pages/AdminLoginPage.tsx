import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Grid2x2, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { getSecretFromHash, storeSessionParameter } from "../utils/urlParams";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 300));

    if (username === "xiaomb" && password === "010613@smn") {
      // Extract token from URL hash and store in sessionStorage
      const caffeineToken = getSecretFromHash("caffeineAdminToken");
      if (caffeineToken) {
        storeSessionParameter("caffeineAdminToken", caffeineToken);
      }
      localStorage.setItem("adminLoggedIn", "true");
      // Remove ALL actor queries so useActor re-runs with the new token in queryKey
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "actor",
      });
      navigate({ to: "/admin" });
    } else {
      setError("账号或密码错误，请重试");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <Grid2x2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-display font-semibold text-primary">
            小面包AI图库
          </h1>
          <p className="text-muted-foreground text-sm mt-1">管理员登录</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">
                账号
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入管理员账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                data-ocid="login.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                  data-ocid="login.input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg"
                data-ocid="login.error_state"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
              data-ocid="login.submit_button"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 animate-bounce" />
                  登录中...
                </span>
              ) : (
                "登录"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
