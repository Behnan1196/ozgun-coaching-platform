'use client'

import React, { useEffect, useState } from 'react'
import { 
  Chat, 
  Channel as ChannelComponent, 
  Window, 
  ChannelHeader, 
  MessageList, 
  MessageInput,
  Thread,
  LoadingIndicator
} from 'stream-chat-react'
import { Video, ExternalLink } from 'lucide-react'
import { useStream } from '@/contexts/StreamContext'

interface StreamChatProps {
  partnerId: string
  partnerName: string
  className?: string
}

export function StreamChat({ partnerId, partnerName, className = '' }: StreamChatProps) {
  const {
    chatClient,
    chatChannel,
    chatLoading,
    chatError,
    initializeChat,
    isStreamReady,
    isDemoMode
  } = useStream()

  // Send video call invitation using Stream.io's proper video call system
  const sendVideoCallInvitation = async () => {
    if (!chatChannel) return

    try {
      // Send a simple but clear video call invitation
      await chatChannel.sendMessage({
        text: `🎥 VIDEO GÖRÜŞME DAVETİ\n\n${partnerName} video görüşme yapmak istiyor!\n\n✅ Katılmak için:\n1️⃣ Tarayıcının adres çubuğuna gidin\n2️⃣ Sonuna "/video" yazın\n3️⃣ Enter'a basın\n\n📱 Veya:\n• Yeni sekme açın\n• Bu sayfanın URL'sinin sonuna "/video" ekleyin\n\n❌ Reddetmek için bu mesajı yoksayın`,
        type: ''
      })
      
      console.log('✅ Video call invitation sent')
    } catch (error) {
      console.error('❌ Failed to send video call invitation:', error)
    }
  }
  
  const [initialized, setInitialized] = useState(false)
  const [showVideoInvitation, setShowVideoInvitation] = useState(false)

  // Initialize chat when component mounts
  useEffect(() => {
    const init = async () => {
      if (isStreamReady && !initialized && partnerId) {
        await initializeChat(partnerId)
        setInitialized(true)
      }
    }
    
    init()
  }, [isStreamReady, partnerId, initialized, initializeChat])

  // Listen for video invitation messages
  useEffect(() => {
    if (!chatChannel) return

    const handleNewMessage = (event: any) => {
      const message = event.message
      if (message.text && message.text.includes('VIDEO GÖRÜŞME DAVETİ')) {
        // Show floating video invitation button for 10 seconds
        setShowVideoInvitation(true)
        setTimeout(() => setShowVideoInvitation(false), 10000)
      }
    }

    chatChannel.on('message.new', handleNewMessage)

    return () => {
      chatChannel.off('message.new', handleNewMessage)
    }
  }, [chatChannel])



  // Loading state
  if (chatLoading || !chatClient) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500">
            Chat yükleniyor...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (chatError) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-red-600">{chatError}</p>
          <button 
            onClick={() => initializeChat(partnerId)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  // Demo mode warning
  if (isDemoMode) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <div className="flex items-center space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Modu
              </h3>
              <p className="text-sm text-yellow-700">
                Stream.io API anahtarları yapılandırılmamış. Gerçek mesajlaşma için API anahtarlarını ekleyin.
              </p>
            </div>
          </div>
        </div>
        
        {/* Demo Chat Interface */}
        <div className="flex-1 p-4">
          <div className="bg-white border rounded-lg h-full flex flex-col">
            <div className="border-b p-4">
              <div className="flex items-center space-x-3">
                <div className="text-blue-500">💬</div>
                <div>
                  <h3 className="font-medium">{partnerName}</h3>
                  <p className="text-sm text-gray-500">Demo mesajlaşma</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="bg-blue-100 p-3 rounded-lg max-w-xs">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  {partnerName}
                </div>
                <div className="text-sm text-blue-700">
                  Merhaba! Bu hafta nasıl gidiyor?
                </div>
                <div className="text-xs text-blue-500 mt-1">10:30</div>
              </div>
              
              <div className="bg-green-100 p-3 rounded-lg max-w-xs ml-auto">
                <div className="text-sm font-medium text-green-800 mb-1">Sen</div>
                <div className="text-sm text-green-700">
                  İyi gidiyor, matematik konularında ilerleme var.
                </div>
                <div className="text-xs text-green-500 mt-1">10:35</div>
              </div>
            </div>
            
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  disabled
                />
                <button 
                  disabled 
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm cursor-not-allowed"
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Real chat interface
  if (!chatChannel) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-3">
          <div className="text-4xl">💬</div>
          <p className="text-sm text-gray-500">
            Chat kanalı hazırlanıyor...
          </p>
        </div>
      </div>
    )
  }

  // Custom header with video call button
  const CustomChannelHeader = () => (
    <div className="str-chat__channel-header flex justify-between items-center p-4 border-b">
      <div className="flex items-center space-x-3">
        <div className="text-blue-500">💬</div>
        <div>
          <h3 className="font-medium">{partnerName}</h3>
          <p className="text-sm text-gray-500">Aktif</p>
        </div>
      </div>
      <button
        onClick={sendVideoCallInvitation}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        title="Video görüşme daveti gönder"
      >
        <Video className="h-4 w-4" />
        <span>Video Ara</span>
      </button>
    </div>
  )

  return (
    <div className={`h-full ${className} relative`}>
      <Chat client={chatClient} theme="str-chat__theme-light">
        <ChannelComponent channel={chatChannel}>
          <Window>
            <CustomChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </ChannelComponent>
      </Chat>
      
      {/* Floating Video Invitation Button */}
      {showVideoInvitation && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <button
            onClick={() => {
              window.open('/video', '_blank')
              setShowVideoInvitation(false)
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors border-2 border-white"
          >
            <Video className="h-5 w-5" />
            <span className="font-medium">Video Görüşmeye Katıl</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default StreamChat 