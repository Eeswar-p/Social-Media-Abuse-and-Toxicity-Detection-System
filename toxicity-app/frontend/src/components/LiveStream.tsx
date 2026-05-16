import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Wifi } from 'lucide-react';

interface LiveStreamProps {
    onNewMessage: (text: string) => void;
    isActive: boolean;
    setIsActive: (active: boolean) => void;
}

const mockMessages = [
    "Hello everyone, how is it going today?",
    "This stream is absolutely amazing!",
    "I will kill you all, watch your back.",
    "Wow, what a nice play there, gg!",
    "You are such a useless idiot.",
    "Great job, obviously sarcasm here.",
    "Anyone want to queue up for a game?",
    "Shut up you worthless piece of trash.",
    "shut the fuck up and get lost.",
    "Yeah right, you are totally legit lol.",
    "Just destroying the enemy team rn.",
    "Nice weather today, loving the sun!",
    "You are a complete waste of a person.",
    "I hate people like you, you're pathetic.",
    "This is so great, keep up the good work!",
    "You are nothing but a brainless moron.",
    "Let's work together and build something.",
    "Go die in a hole you disgusting freak.",
    "Have a wonderful and peaceful day everyone!",
    "You will pay for this, I will destroy you.",
];

const userNames = ['Alex_G', 'ProGamer99', 'ShadowX', 'MoonWalker', 'CryptoFan', 'NightOwl', 'StreamerPro', 'QuietStorm', 'BlueHorizon', 'RedFox'];

export function LiveStream({ onNewMessage, isActive, setIsActive }: LiveStreamProps) {
    const [messages, setMessages] = useState<{ text: string; user: string; id: number }[]>([]);
    const chatRef = useRef<HTMLDivElement>(null);
    const msgId = useRef(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive) {
            interval = setInterval(() => {
                const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
                const randomUser = userNames[Math.floor(Math.random() * userNames.length)];
                msgId.current += 1;
                setMessages(prev => [...prev, { text: randomMsg, user: randomUser, id: msgId.current }].slice(-12));
                onNewMessage(randomMsg);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isActive, onNewMessage]);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.01]">
                <div className="flex items-center gap-2.5">
                    <Wifi className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-600'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Stream Simulator</span>
                    {isActive && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> LIVE
                        </motion.span>
                    )}
                </div>
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${isActive
                            ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/25'
                            : 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/25'
                        }`}
                >
                    {isActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isActive ? 'Stop' : 'Start Simulation'}
                </button>
            </div>

            {/* Chat */}
            <div ref={chatRef} className="h-52 overflow-y-auto p-4 space-y-2.5">
                <AnimatePresence initial={false}>
                    {messages.map(({ text, user, id }) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -16, scale: 0.97 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-start gap-2.5 group"
                        >
                            {/* Avatar */}
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] font-black text-white">{user[0]}</span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2 flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-indigo-400 mr-2">{user}</span>
                                <span className="text-slate-300 text-xs">{text}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {!isActive && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 text-sm gap-2">
                        <Wifi className="w-8 h-8 opacity-30" />
                        <span className="italic">Press Start to simulate a live chat stream</span>
                    </div>
                )}
            </div>
        </div>
    );
}
