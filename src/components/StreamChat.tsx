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
import { Video, Phone, PhoneOff } from 'lucide-react'
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

  // WhatsApp-like video calling system
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming'>('idle')
  const [incomingCall, setIncomingCall] = useState<{from: string, timestamp: Date} | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Start video call (WhatsApp style - immediate)
  const startVideoCall = async () => {
    if (!chatChannel) return

    try {
      setCallState('calling')
      
      // Send call signal to other user using regular message
      await chatChannel.sendMessage({
        text: `📞 Video görüşme başlatıyor...`,
        type: '', // Use regular message type
        // Put call data in the message itself
        attachments: [{
          type: 'video_call_signal',
          title: 'Video Görüşme',
          text: `${partnerName} video görüşme başlatıyor`,
          actions: [],
          call_type: 'video_call_start',
          caller: partnerName,
          timestamp: new Date().toISOString()
        }]
      })
      
      // Simulate call connection and redirect to video page
      setTimeout(() => {
        window.location.href = '/video'
      }, 2000)
      
      console.log('📞 Video call started')
    } catch (error) {
      console.error('❌ Failed to start video call:', error)
      setCallState('idle')
    }
  }

  // Accept incoming call
  const acceptCall = () => {
    setCallState('idle')
    setIncomingCall(null)
    window.location.href = '/video'
  }

  // Decline incoming call
  const declineCall = () => {
    setCallState('idle')
    setIncomingCall(null)
  }

  // Cancel outgoing call
  const cancelCall = () => {
    setCallState('idle')
  }

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

  // Listen for incoming calls
  useEffect(() => {
    if (!chatChannel) return

    const handleNewMessage = (event: any) => {
      const message = event.message
      
      // Check for incoming video call in attachments
      if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0]
        if (attachment.type === 'video_call_signal' && attachment.call_type === 'video_call_start') {
          setCallState('incoming')
          setIncomingCall({
            from: attachment.caller || 'Bilinmeyen',
            timestamp: new Date(attachment.timestamp || new Date())
          })
          
          // Auto-decline after 30 seconds
          setTimeout(() => {
            if (callState === 'incoming') {
              setCallState('idle')
              setIncomingCall(null)
            }
          }, 30000)
        }
      }
    }

    chatChannel.on('message.new', handleNewMessage)

    return () => {
      chatChannel.off('message.new', handleNewMessage)
    }
  }, [chatChannel, callState])



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

  // Custom header with WhatsApp-style video call button
  const CustomChannelHeader = () => (
    <div className="str-chat__channel-header flex justify-between items-center p-4 border-b">
      <div className="flex items-center space-x-3">
        <div className="text-blue-500">💬</div>
        <div>
          <h3 className="font-medium">{partnerName}</h3>
          <p className="text-sm text-gray-500">
            {callState === 'calling' ? 'Aranıyor...' : 'Aktif'}
          </p>
        </div>
      </div>
      <button
        onClick={startVideoCall}
        disabled={callState !== 'idle'}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          callState === 'calling' 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } text-white`}
        title="Video görüşme başlat"
      >
        <Video className="h-4 w-4" />
        <span>{callState === 'calling' ? 'Aranıyor...' : 'Video Ara'}</span>
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
      
      {/* WhatsApp-style Calling Screen */}
      {callState === 'calling' && (
        <div className="fixed inset-0 bg-green-600 z-50 flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <Video className="h-16 w-16" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{partnerName}</h2>
              <p className="text-lg opacity-90">Aranıyor...</p>
            </div>
            <button
              onClick={cancelCall}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}
      
      {/* WhatsApp-style Incoming Call */}
      {callState === 'incoming' && incomingCall && (
        <div className="fixed inset-0 bg-gray-900/95 z-50 flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Video className="h-16 w-16" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{incomingCall.from}</h2>
              <p className="text-lg opacity-90">Video görüşme başlatıyor...</p>
            </div>
            <div className="flex space-x-8">
              <button
                onClick={declineCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="h-8 w-8" />
              </button>
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Phone className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StreamChat 