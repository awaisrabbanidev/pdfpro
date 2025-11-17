export const dynamic = 'force-dynamic'; // Ensures server-side rendering

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        <p className="text-lg text-gray-300">
         This is a Project of Growth Partners Co. For questions or support, please email us at support@growthpartnersco.com
        </p>
      </div>
    </div>
  );
}
