import React from "react"

const AUTO_RELOAD_KEY = "puro_tech_error_boundary_autoreload_once"

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error) {
        console.error("Critical runtime error:", error)
        try {
            if (!window.sessionStorage.getItem(AUTO_RELOAD_KEY)) {
                window.sessionStorage.setItem(AUTO_RELOAD_KEY, "true")
                window.setTimeout(() => {
                    window.location.reload()
                }, 2000)
            }
        } catch {
            // Ignore sessionStorage/access issues and keep fallback UI active.
        }
    }

    handleReload = () => {
        try {
            window.sessionStorage.removeItem(AUTO_RELOAD_KEY)
        } catch {
            // Ignore storage access issues.
        }
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
                    <div className="w-full max-w-md rounded-xl border border-red-500/60 bg-gray-900/80 p-6 text-center">
                        <p className="text-lg font-semibold mb-3">Something went wrong. Reload the page.</p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="min-h-[44px] rounded-lg bg-red-600 px-5 py-2 font-semibold hover:bg-red-500 transition"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
