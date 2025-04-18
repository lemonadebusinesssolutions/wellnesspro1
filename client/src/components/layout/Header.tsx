import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "?";
    if (user.displayName) {
      const nameParts = user.displayName.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.displayName[0].toUpperCase();
    }
    return user.username[0].toUpperCase();
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/assessments", label: "Assessments" },
    { path: "/dashboard", label: "Dashboardd" },
    { path: "/dashboard/journal", label: "Journal" },
    { path: "/resources", label: "Resources" },
    { path: "/about", label: "About" },
  ];

  return (
    <header className="bg-background border-b border-border shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <Link href="/">
            <span className="ml-2 text-xl font-semibold text-foreground dark:text-white cursor-pointer">
              Wellbeing Compass
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-8">
          {navItems.map(({ path, label }) => (
            <Link key={path} href={path}>
              <span className={location === path
                ? "text-primary font-medium cursor-pointer dark:text-cyan-400"
                : "text-muted-foreground hover:text-foreground font-medium cursor-pointer dark:text-gray-300 dark:hover:text-white"}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.displayName || user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem className="cursor-pointer">
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 focus:text-red-500"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setLocation("/auth")} variant="default" size="sm">
              Sign In
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden ml-2 text-foreground dark:text-white"
            aria-label="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col space-y-4 bg-background border-t border-border">
          {navItems.map(({ path, label }) => (
            <Link key={path} href={path}>
              <span className="text-muted-foreground hover:text-foreground font-medium cursor-pointer dark:text-gray-300 dark:hover:text-white">
                {label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
