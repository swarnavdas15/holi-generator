export default function Controls({
    addSplash,
    download,
    selectedColor,
    setSelectedColor,
    colorOptions,
    isAnimating,
    shareCaption,
    shareOnWhatsApp,
    shareOnFacebook,
    shareOnInstagram,
    shareOnSnapchat,
    copyCaption
}) {

    return (

        <div className="flex flex-col items-center gap-4 mt-6">

            <div className="flex items-center gap-3 flex-wrap justify-center">

                {colorOptions.map((option) => (

                    <button
                        key={option.name}
                        type="button"
                        onClick={() => setSelectedColor(option.value)}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                            selectedColor === option.value
                                ? "border-white scale-110"
                                : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.name}
                        aria-label={`Select ${option.name}`}
                    />

                ))}

            </div>

            <div className="flex gap-4">

                <button
                    onClick={addSplash}
                    disabled={isAnimating}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                        isAnimating
                            ? "bg-red-900/70 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-500"
                    }`}
                >

                    {isAnimating ? "Throwing Colors..." : "Add Splash"}

                </button>

                <button
                    onClick={download}
                    className="bg-gray-800 px-6 py-2 rounded-lg hover:bg-gray-700"
                >

                    Download

                </button>

            </div>

            <div className="w-full max-w-xl mt-4 rounded-xl border border-gray-700 bg-gray-900/70 p-4">

                <p className="text-sm font-semibold text-gray-200 mb-3">
                    Share Your Holi Creation
                </p>

                <div className="flex flex-wrap gap-3">

                    <button
                        type="button"
                        onClick={shareOnWhatsApp}
                        className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-lg font-semibold"
                    >
                        Share on WhatsApp
                    </button>

                    <button
                        type="button"
                        onClick={shareOnFacebook}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold"
                    >
                        Share on Facebook
                    </button>

                    <button
                        type="button"
                        onClick={shareOnInstagram}
                        className="bg-pink-600 hover:bg-pink-500 px-4 py-2 rounded-lg font-semibold"
                    >
                        Share on Instagram
                    </button>

                    <button
                        type="button"
                        onClick={shareOnSnapchat}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-lg font-semibold"
                    >
                        Share on Snapchat
                    </button>

                </div>

                <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2">Caption</p>
                    <pre className="whitespace-pre-wrap text-sm bg-black/40 rounded-lg p-3 text-gray-200">
                        {shareCaption}
                    </pre>
                    <button
                        type="button"
                        onClick={copyCaption}
                        className="mt-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
                    >
                        Copy Caption
                    </button>
                </div>

            </div>

        </div>

    )

}
