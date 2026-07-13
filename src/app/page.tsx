import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { ArrowRight, Droplet, HandHeart } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import StatCard from "@/components/stat-card";
import { adminStats } from "@/lib/data";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-image");
  const staffImage = PlaceHolderImages.find(
    (img) => img.id === "staff-operations-image"
  );
  const landingStats = adminStats.slice(0, 3).map(stat => {
    if (stat.title === 'Urgent Requests') {
      return {...stat, value: '12+', change: '-5.2% from last week', icon: stat.icon, href: '/dashboard'};
    }
    if(stat.title === 'Total Units Available') {
        return {...stat, href: '/dashboard'}
    }
    if(stat.title === 'Active Donors') {
        return {...stat, href: '/register'}
    }
    return {...stat, href: '#'};
  });


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 px-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
                <Logo />
                <span className="font-headline text-lg font-semibold text-primary hidden sm:inline-block">
                    BloodAid
                </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Blood Banks</Link>
                <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">For Donors</Link>
            </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              Find Blood <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-24 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Connect Donors, Save Lives
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    BloodAid is a real-time platform bridging the gap
                    between blood donors, recipients, and blood banks across
                    the nation.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      <Droplet className="mr-2 h-5 w-5" />
                      Find Blood
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/register">
                      <HandHeart className="mr-2 h-5 w-5" />
                      Become a Donor
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-full blur-3xl -z-10 -translate-x-20"></div>
                    <Image
                      src={heroImage.imageUrl}
                      alt={heroImage.description}
                      width={550}
                      height={400}
                      className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full shadow-2xl shadow-primary/10"
                      data-ai-hint={heroImage.imageHint}
                      priority
                    />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {landingStats.map((stat) => (
                stat.href ? (
                    <Link href={stat.href} key={stat.title}>
                        <StatCard stat={stat} className="h-full transition-all hover:shadow-lg hover:-translate-y-1"/>
                    </Link>
                ) : (
                    <StatCard key={stat.title} stat={stat} />
                )
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                <div className="flex items-center justify-center order-last lg:order-first">
                    {staffImage && (
                    <Image
                        src={staffImage.imageUrl}
                        alt={staffImage.description}
                        width={500}
                        height={350}
                        className="rounded-lg object-cover shadow-2xl"
                        data-ai-hint={staffImage.imageHint}
                    />
                    )}
                </div>
                <div className="flex flex-col justify-center space-y-4">
                    <div className="space-y-2">
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        For Hospitals & Staff
                    </div>
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">
                        Streamline Your Blood Bank Operations
                    </h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Manage inventory, predict demand with AI, and handle urgent
                        requests efficiently. Our platform empowers your staff to
                        save more lives.
                    </p>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                    <Button size="lg" asChild>
                        <Link href="/login">
                        Staff Login <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-4 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 BloodAid. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            About
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Privacy
          </Link>
           <Link
            href="/help"
            className="text-xs hover:underline underline-offset-4"
          >
            Help
          </Link>
        </nav>
      </footer>
    </div>
  );
}

