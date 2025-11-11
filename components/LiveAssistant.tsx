import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TranscriptionEntry } from '../types';
import { MicIcon, StopIcon, RobotIcon, UserIcon, SystemIcon } from './icons';

// Audio Encoding & Decoding functions
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

const LiveAssistant: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcription]);

    const addTranscriptionEntry = (type: 'user' | 'model' | 'system', text: string) => {
        setTranscription(prev => [...prev, { id: Date.now().toString(), type, text }]);
    };

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscriptionRef.current += text;
        } else if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscriptionRef.current += text;
        }

        if (message.serverContent?.turnComplete) {
            const fullInput = currentInputTranscriptionRef.current;
            const fullOutput = currentOutputTranscriptionRef.current;
            if (fullInput.trim()) addTranscriptionEntry('user', fullInput);
            if (fullOutput.trim()) addTranscriptionEntry('model', fullOutput);
            
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && audioContextRef.current) {
            const { output: outputAudioContext } = audioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
            }
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    }, []);

    const stopConversation = useCallback(async () => {
        addTranscriptionEntry('system', 'Conversa encerrada.');
        setIsConnected(false);
        setIsConnecting(false);

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.input.close();
            audioContextRef.current.output.close();
            audioContextRef.current = null;
        }
        
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (error) {
                console.error("Error closing session:", error);
            } finally {
                sessionPromiseRef.current = null;
            }
        }
    }, []);

    const startConversation = useCallback(async () => {
        if (isConnecting || isConnected) return;

        setIsConnecting(true);
        setTranscription([{ id: 'start', type: 'system', text: 'Conectando ao Assistente ao Vivo...' }]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        
        try {
            if (!process.env.API_KEY) throw new Error("API Key not found");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = { input: inputAudioContext, output: outputAudioContext };

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsConnected(true);
                        addTranscriptionEntry('system', 'Conectado! Comece a falar.');
                        
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: handleMessage,
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        addTranscriptionEntry('system', `Erro: ${e.message}. Por favor, tente novamente.`);
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live API Closed:', e);
                        if(isConnected) {
                           addTranscriptionEntry('system', 'Conexão encerrada.');
                           setIsConnected(false);
                           setIsConnecting(false);
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: 'Você é um assistente agrícola amigável e prestativo da ON FERT. Responda a perguntas sobre agricultura, saúde do solo e nossos produtos de forma concisa.',
                },
            });
        } catch (error) {
            console.error("Failed to start conversation:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addTranscriptionEntry('system', `Falha ao iniciar: ${errorMessage}`);
            setIsConnecting(false);
            setIsConnected(false);
        }
    }, [isConnecting, isConnected, handleMessage, stopConversation]);

    const TranscriptionIcon = ({ type }: { type: 'user' | 'model' | 'system' }) => {
        const commonClasses = "h-6 w-6 mr-3 flex-shrink-0";
        if (type === 'user') return <UserIcon className={`${commonClasses} text-blue-500`} />;
        if (type === 'model') return <RobotIcon className={`${commonClasses} text-green-500`} />;
        return <SystemIcon className={`${commonClasses} text-gray-500`} />;
    };
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg h-full flex flex-col max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Assistente ao Vivo</h2>
            <p className="text-gray-600 mb-6">Tenha uma conversa em tempo real com nosso assistente de IA. Pergunte sobre tipos de solo, problemas de cultura ou nossos produtos.</p>
            
            <div ref={chatContainerRef} className="flex-grow bg-gray-100 rounded-lg p-4 overflow-y-auto mb-6 min-h-[300px]">
                <div className="space-y-4">
                    {transcription.map(entry => (
                        <div key={entry.id} className="flex items-start">
                           <TranscriptionIcon type={entry.type} />
                           <p className={`flex-1 text-sm ${entry.type === 'system' ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                               {entry.text}
                           </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto">
                {!isConnected && !isConnecting && (
                    <button onClick={startConversation} className="w-full flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                        <MicIcon className="h-6 w-6" />
                        Iniciar Conversa
                    </button>
                )}
                 {isConnecting && (
                    <button disabled className="w-full flex items-center justify-center gap-3 bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                        <MicIcon className="h-6 w-6 animate-pulse" />
                        Conectando...
                    </button>
                )}
                {isConnected && (
                    <button onClick={stopConversation} className="w-full flex items-center justify-center gap-3 bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                        <StopIcon className="h-6 w-6" />
                        Encerrar Conversa
                    </button>
                )}
            </div>
        </div>
    );
};

export default LiveAssistant;