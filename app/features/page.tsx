"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Check,
    X,
    Star,
    Zap,
    Shield,
    Cloud,
    Users,
    Database,
    Search,
    Package,
    Layers,
    Palette,
    Share2,
    Timer,
    Folder,
    Globe
} from "lucide-react"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function FeaturesPage() {
    // SEO structured data
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Excalidraw vs Enhanced Project Manager - Feature Comparison",
        "description": "Compare free Excalidraw with our enhanced project manager. Get advanced features like project management, cloud sync, and collaboration tools.",
        "url": "https://excalidraw.devh.in",
        "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "Enhanced Excalidraw Project Manager",
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "featureList": [
                "Project Management System",
                "Cloud Synchronization (Coming Soon)",
                "Advanced Export/Import",
                "Project Organization",
                "Search & Filter",
                "Bulk Operations"
            ]
        }
    }

    const features = [
        {
            category: "Project Management",
            icon: <Folder className="w-6 h-6" />,
            items: [
                {
                    feature: "Multiple Project Support",
                    free: false,
                    enhanced: true,
                    description: "Create and manage multiple drawing projects with unique URLs",
                    upcoming: false
                },
                {
                    feature: "Project Organization",
                    free: false,
                    enhanced: true,
                    description: "Organize projects with names, descriptions, and timestamps",
                    upcoming: false
                },
                {
                    feature: "Quick Project Switching",
                    free: false,
                    enhanced: true,
                    description: "Switch between projects with clean URLs and direct links",
                    upcoming: false
                }
            ]
        },
        {
            category: "Search & Discovery",
            icon: <Search className="w-6 h-6" />,
            items: [
                {
                    feature: "Intelligent Search",
                    free: false,
                    enhanced: true,
                    description: "Fuzzy search across project names and descriptions",
                    upcoming: false
                },
                {
                    feature: "Project Filtering",
                    free: false,
                    enhanced: true,
                    description: "Filter projects by creation date, modification time, and more",
                    upcoming: false
                },
                {
                    feature: "Quick Access URLs",
                    free: false,
                    enhanced: true,
                    description: "Short, memorable URLs for each project",
                    upcoming: false
                }
            ]
        },
        {
            category: "Data Management",
            icon: <Database className="w-6 h-6" />,
            items: [
                {
                    feature: "Advanced Export/Import",
                    free: "Basic",
                    enhanced: true,
                    description: "Bulk export/import with metadata and project information",
                    upcoming: false
                },
                {
                    feature: "Project Backup",
                    free: "Manual",
                    enhanced: true,
                    description: "Automated project backup with JSON format",
                    upcoming: false
                },
                {
                    feature: "Data Portability",
                    free: false,
                    enhanced: true,
                    description: "Easy migration between instances with full data integrity",
                    upcoming: false
                }
            ]
        },
        {
            category: "User Experience",
            icon: <Palette className="w-6 h-6" />,
            items: [
                {
                    feature: "Project Dashboard",
                    free: false,
                    enhanced: true,
                    description: "Visual dashboard with project overview and quick actions",
                    upcoming: false
                },
                {
                    feature: "Persistent Storage",
                    free: "Session only",
                    enhanced: true,
                    description: "Projects saved in browser localStorage with persistence",
                    upcoming: false
                },
                {
                    feature: "Theme Support",
                    free: "Basic",
                    enhanced: true,
                    description: "Enhanced dark/light theme with system preference detection",
                    upcoming: false
                }
            ]
        },
        {
            category: "Collaboration (Coming Soon)",
            icon: <Users className="w-6 h-6" />,
            items: [
                {
                    feature: "Cloud Synchronization",
                    free: false,
                    enhanced: "Coming Soon",
                    description: "Sync projects across devices with cloud storage",
                    upcoming: true
                },
                {
                    feature: "Team Workspaces",
                    free: false,
                    enhanced: "Coming Soon",
                    description: "Shared workspaces for team collaboration",
                    upcoming: true
                },
                {
                    feature: "Real-time Collaboration",
                    free: false,
                    enhanced: "Coming Soon",
                    description: "Live collaborative editing with multiple users",
                    upcoming: true
                }
            ]
        }
    ]

    return (
        <div className="container mx-auto p-6">
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <header className="mb-8">
                    <nav className="flex items-center space-x-2 mb-4" aria-label="Breadcrumb">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Projects
                            </Link>
                        </Button>
                    </nav>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">
                            Enhanced Excalidraw vs Free Version
                        </h1>
                        <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
                            Discover the powerful features that make our enhanced version the perfect choice for
                            professional designers, developers, and teams who need more than basic drawing tools.
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            <Badge variant="secondary" className="text-sm">
                                <Star className="w-4 h-4 mr-1" />
                                100% Free Forever
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                <Shield className="w-4 h-4 mr-1" />
                                Privacy First
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                <Cloud className="w-4 h-4 mr-1" />
                                Cloud Sync Coming Soon
                            </Badge>
                        </div>
                    </div>
                </header>

                {/* Quick comparison overview */}
                <section className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Free Excalidraw
                                </CardTitle>
                                <CardDescription>
                                    The original open-source drawing tool
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Basic drawing and diagramming
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Simple export functionality
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <X className="w-4 h-4 text-red-500" />
                                        No project management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <X className="w-4 h-4 text-red-500" />
                                        Session-based storage only
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary" />
                                    Enhanced Project Manager
                                    <Badge className="ml-2">Recommended</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Advanced features for professional use
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Everything from free version
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Advanced project management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Persistent storage & organization
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-blue-500" />
                                        Cloud sync coming soon
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Detailed feature comparison */}
                <section aria-label="Feature comparison">
                    <h2 className="text-2xl font-bold mb-8 text-center">Detailed Feature Comparison</h2>

                    <div className="space-y-8">
                        {features.map((category, categoryIndex) => (
                            <Card key={categoryIndex}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        {category.icon}
                                        {category.category}
                                        {category.category.includes("Coming Soon") && (
                                            <Badge variant="outline" className="ml-2">
                                                <Timer className="w-3 h-3 mr-1" />
                                                Coming Soon
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {category.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="border rounded-lg p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                                    <div>
                                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                                            {item.feature}
                                                            {item.upcoming && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Soon
                                                                </Badge>
                                                            )}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.description}
                                                        </p>
                                                    </div>

                                                    <div className="text-center">
                                                        <p className="text-sm font-medium mb-2">Free Excalidraw</p>
                                                        {item.free === true ? (
                                                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                                                        ) : item.free === false ? (
                                                            <X className="w-6 h-6 text-red-500 mx-auto" />
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">{item.free}</span>
                                                        )}
                                                    </div>

                                                    <div className="text-center">
                                                        <p className="text-sm font-medium mb-2">Enhanced Version</p>
                                                        {item.enhanced === true ? (
                                                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                                                        ) : item.enhanced === false ? (
                                                            <X className="w-6 h-6 text-red-500 mx-auto" />
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.enhanced}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Cloud sync announcement */}
                <section className="mt-12">
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                                <Cloud className="w-6 h-6" />
                                Cloud Sync Coming Soon
                            </CardTitle>
                            <CardDescription className="text-lg">
                                The next evolution of collaborative drawing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                                        <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="font-medium mb-2">Cross-Device Sync</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Access your projects from any device, anywhere
                                    </p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                                        <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="font-medium mb-2">Team Collaboration</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Real-time collaboration with team members
                                    </p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-3">
                                        <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="font-medium mb-2">Secure Backup</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Encrypted cloud storage for your projects
                                    </p>
                                </div>
                            </div>

                            <p className="text-muted-foreground mb-6">
                                Sign up for early access and be the first to experience the future of collaborative drawing.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" asChild>
                                    <Link href="/">
                                        Start Using Enhanced Version
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Why choose enhanced version */}
                <section className="mt-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">Why Choose the Enhanced Version?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium mb-3">For Individual Users</h3>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Organize multiple design projects efficiently</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Never lose work with persistent storage</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Quick access to recent projects</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Advanced backup and restore capabilities</span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-3">For Teams & Organizations</h3>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Share projects easily with export/import</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                            <span>Standardized project organization</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Timer className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <span>Upcoming real-time collaboration</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Timer className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <span>Team workspaces and cloud sync</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Mission Statement */}
                <section className="my-12">
                    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                        <CardHeader>
                            <div className="mb-6 p-4 bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-3xl text-center">
                                <p className="mb-3">This project is not affiliated with Excalidraw or the Excalidraw team. It was developed using @excalidraw/excalidraw just for fun and as a timepass.</p>
                                <div className="flex flex-wrap justify-center gap-4 text-sm">
                                    <Link href="https://github.com/excalidraw/excalidraw" target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        📦 Excalidraw Monorepo
                                    </Link>
                                    <Link href="https://github.com/S4tyendra/excalidraw" target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        🚀 This Project's Repo
                                    </Link>
                                </div>
                            </div>
                            <CardTitle className="text-center text-xl">Why We Built This Enhanced Version</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">

                            <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
                                We believe everyone deserves access to professional-grade drawing tools, regardless of budget. This enhanced version was created specifically for individuals and small teams who need organized project management but can't afford premium subscriptions.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                                    <h3 className="font-semibold mb-2">💝 Love the Original?</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Try the amazing free version that inspired this project
                                    </p>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="https://excalidraw.com" target="_blank" rel="noopener noreferrer">
                                            Visit Excalidraw.com
                                        </Link>
                                    </Button>
                                </div>

                                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                                    <h3 className="font-semibold mb-2">🚀 Ready for Premium?</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Support the creators and get official premium features
                                    </p>
                                    <Button asChild size="sm">
                                        <Link href="https://plus.excalidraw.com/plus" target="_blank" rel="noopener noreferrer">
                                            Upgrade to Excalidraw Plus
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground italic border-t pt-4">
                                <p>
                                    This project is built with love and respect for the original Excalidraw team.
                                    If our enhanced version helps you realize the value of organized drawing tools,
                                    please consider supporting the official Excalidraw Plus to help sustain the ecosystem.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>



                {/* FAQ Section for SEO */}
                <section className="mt-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium mb-2">Is the enhanced version really free?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Yes! Our enhanced Excalidraw project manager is completely free forever. We believe in making powerful drawing tools accessible to everyone.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">When will cloud sync be available?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Cloud synchronization is currently in development. We're working hard to bring you secure, reliable cloud sync that will let you access your projects from any device.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">How does project management work?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Our project management system lets you create multiple drawing projects, each with its own unique URL. You can organize them with names and descriptions, search through them, and switch between projects seamlessly.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Can I migrate from regular Excalidraw?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Yes! You can export your drawings from regular Excalidraw and import them into our enhanced version using our advanced import feature. Your work will be preserved and enhanced with our project management capabilities.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
    )
}
