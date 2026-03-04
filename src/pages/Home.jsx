import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Footer from "../components/Footer"

export default function Home() {
    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#050505] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(255,46,99,0.2),transparent_38%),radial-gradient(circle_at_92%_20%,rgba(0,200,255,0.16),transparent_36%),radial-gradient(circle_at_16%_90%,rgba(255,212,0,0.16),transparent_34%),radial-gradient(circle_at_86%_86%,rgba(0,255,156,0.14),transparent_34%)]" />

            <Navbar />

            <main className="relative flex-grow">
                <Hero />
            </main>

            <Footer />
        </div>
    )
}
