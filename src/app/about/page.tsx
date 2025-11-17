export const dynamic = 'force-dynamic'; // Ensures page is server-rendered

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-8">About PDFPro.pro</h1>
        <p className="text-lg text-gray-300">
          PDFPro.pro provides a suite of free, powerful, and easy-to-use online PDF tools for all your document needs.
        </p>
      </div>
    </div>
  );
}
