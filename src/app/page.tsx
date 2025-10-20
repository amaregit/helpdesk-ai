import Chat from '@/components/Chat'

export default function Home() {
  return (
    <main className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col min-w-0">
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col min-w-0 min-h-0">
        <div className="max-w-6xl mx-auto flex-1 flex flex-col min-w-0 min-h-0 w-full">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              HelpDesk AI
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ask me anything about our pricing, refund policies, or getting started. 
              I&apos;ll find the right information from our documentation.
            </p>
          </div>
          <div className="flex-1 w-full min-w-0 min-h-0">
            <Chat />
          </div>
        </div>
      </div>
    </main>
  )
}
