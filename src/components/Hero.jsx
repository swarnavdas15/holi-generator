import { useMemo } from "react"
import { Link } from "react-router-dom"
import puchu from "../assets/pucchu-avatar.png"
import roni from "../assets/roni-avatar.png"

export default function Hero() {
    const particles = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => ({
                id: i,
                left: `${5 + ((i * 37) % 90)}%`,
                top: `${8 + ((i * 29) % 78)}%`,
                size: 4 + (i % 4) * 2,
                delay: `${(i % 7) * 0.4}s`,
                duration: `${5 + (i % 5)}s`,
                color: ["#ff2e63", "#ffd400", "#00ff9c", "#00c8ff", "#ff7af6"][i % 5]
            })),
        []
    )

    return (
        <section className="relative overflow-hidden min-h-screen flex items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,46,99,0.28),transparent_40%),radial-gradient(circle_at_85%_18%,rgba(0,200,255,0.25),transparent_38%),radial-gradient(circle_at_15%_80%,rgba(255,212,0,0.22),transparent_36%),radial-gradient(circle_at_90%_78%,rgba(0,255,156,0.2),transparent_35%)]" />

            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <span
                        key={p.id}
                        className="absolute rounded-full opacity-70 blur-[1px]"
                        style={{
                            left: p.left,
                            top: p.top,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            animation: `floatY ${p.duration} ease-in-out ${p.delay} infinite`
                        }}
                    />
                ))}
            </div>

            <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
                <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] items-center gap-8">
                    <div className="flex justify-center md:justify-self-end md:translate-x-6 order-1">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[radial-gradient(circle,rgba(255,46,99,0.5),transparent_65%)] blur-xl" />
                            <img
                                src={roni}
                                alt="Puchu mascot"
                                className="relative w-[220px] md:w-[240px] mx-auto drop-shadow-[0_16px_35px_rgba(0,0,0,0.5)]"
                                style={{ animation: "floatY 4.8s ease-in-out infinite" }}
                            />
                        </div>
                    </div>

                    <div className="max-w-2xl mx-auto text-center flex flex-col items-center justify-center gap-4 order-2">
                        <p className="text-red-400 font-semibold tracking-[0.18em] text-sm sm:text-base">
                            PURO TECH HOLI SPECIAL
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold leading-tight max-w-xl text-yellow-400 drop-shadow-lg">
                            Celebrate Colors,
                            <br />
                            Celebrate Life!
                        </h2>
                        <p className="max-w-md text-gray-300 text-lg">
                            PURO TECH wishes you a colorful and joyful Holi. Craft your own festive portrait in seconds.
                        </p>
                        <Link to="/editor" className="inline-block mt-6 w-full md:w-auto">
                            <button className="w-full md:w-auto min-h-[44px] rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-orange-500 px-8 py-3 text-lg text-white font-semibold shadow-[0_10px_30px_rgba(220,38,38,0.45)] transition-transform duration-200 hover:scale-105">
                                Rang Lagao! Create Your Holi Moment
                            </button>
                        </Link>
                    </div>

                    <div className="flex justify-center md:justify-self-start md:-translate-x-6 order-3">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[radial-gradient(circle,rgba(0,200,255,0.45),transparent_65%)] blur-xl" />
                            <img
                                src={puchu}
                                alt="Roni mascot"
                                className="relative w-[220px] md:w-[240px] mx-auto drop-shadow-[0_16px_35px_rgba(0,0,0,0.5)]"
                                style={{ animation: "floatY 5.2s ease-in-out 0.4s infinite" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes floatY {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </section>
    )
}
