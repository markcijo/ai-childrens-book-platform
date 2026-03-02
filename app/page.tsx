import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI Children's Book Platform</h1>
        <p className="text-lg text-gray-600 mb-8">
          Create illustrated children's books with AI
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
