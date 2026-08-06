import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Headphones, Volume2, ShieldCheck, X, RotateCcw } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const AudioPlayer = () => {
  const { currentTrack, playBookAudio } = usePlayer();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [words, setWords] = useState([]);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!currentTrack) return;

    // Default book text to read aloud word by word
    const textToRead = currentTrack.sampleEbookText || 
      `Chapter 1 of ${currentTrack.title}. Written by ${currentTrack.authorName}. Welcome to ReadPulse word by word spoken narration.`;

    const wordList = textToRead.split(/\s+/).filter(Boolean);
    setWords(wordList);
    setActiveWordIndex(-1);

    // Cancel previous speech
    synthRef.current.cancel();

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = playbackSpeed;
    utteranceRef.current = utterance;

    let wordPosMap = [];
    let currentPos = 0;
    wordList.forEach((w, idx) => {
      wordPosMap.push({ index: idx, charStart: currentPos });
      currentPos += w.length + 1;
    });

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        let matchIdx = 0;
        for (let i = 0; i < wordPosMap.length; i++) {
          if (wordPosMap[i].charStart <= charIdx) {
            matchIdx = i;
          } else {
            break;
          }
        }
        setActiveWordIndex(matchIdx);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setActiveWordIndex(-1);
    };

    synthRef.current.speak(utterance);
    setIsPlaying(true);

    return () => {
      synthRef.current.cancel();
    };
  }, [currentTrack]);

  const togglePlayPause = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
      } else if (currentTrack) {
        const textToRead = currentTrack.sampleEbookText || `Chapter 1 of ${currentTrack.title}. Written by ${currentTrack.authorName}.`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = playbackSpeed;
        synthRef.current.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (synthRef.current && isPlaying) {
      synthRef.current.cancel();
      const textToRead = currentTrack.sampleEbookText || `Chapter 1 of ${currentTrack.title}.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = newSpeed;
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  };

  const handleClose = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
    playBookAudio(null);
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#fafaf9] border-t-4 border-slate-900 px-4 py-3 shadow-[0_-6px_0_0_rgba(15,23,42,1)] animate-in slide-in-from-bottom-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Book Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4">
          <img
            src={currentTrack.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150"}
            alt={currentTrack.title}
            className="w-12 h-12 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] object-cover shrink-0"
          />
          <div className="truncate">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate flex items-center gap-1.5">
              {currentTrack.title}
            </h4>
            <p className="text-[10px] text-slate-500 font-bold truncate">By {currentTrack.authorName}</p>
            <span className="text-[8px] bg-[#a3e635] text-slate-900 border border-slate-900 px-1.5 py-0.2 font-mono font-black uppercase inline-block mt-0.5">
              Spoken Word Narration
            </span>
          </div>
        </div>

        {/* Center: Spoken Word-by-Word Live Text Bar */}
        <div className="flex-1 w-full bg-white border-3 border-slate-900 p-2.5 shadow-[3px_3px_0_0_rgba(15,23,42,1)] flex items-center justify-between gap-3 overflow-hidden">
          
          <button
            onClick={togglePlayPause}
            className="w-9 h-9 bg-[#a3e635] hover:bg-[#8fd02c] border-2 border-slate-900 text-slate-900 flex items-center justify-center shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] active:translate-y-[1px] shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Word ticker display */}
          <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none text-xs font-serif flex items-center gap-1.5 px-2">
            {words.length === 0 ? (
              <span className="text-slate-400 font-sans text-[11px] font-bold">Initializing spoken book narration...</span>
            ) : (
              words.map((word, idx) => (
                <span
                  key={idx}
                  className={`transition-all font-mono font-black text-xs inline-block ${
                    idx === activeWordIndex
                      ? 'bg-[#facc15] text-slate-900 border-2 border-slate-900 px-1.5 py-0.5 shadow-[1.5px_1.5px_0_0_rgba(15,23,42,1)] scale-110'
                      : 'text-slate-500'
                  }`}
                >
                  {word}
                </span>
              ))
            )}
          </div>

          {/* Speed Selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="bg-[#fafaf9] border-2 border-slate-900 text-[10px] font-black uppercase text-slate-900 px-2 py-1 shadow-[1px_1px_0_0_rgba(15,23,42,1)] focus:outline-none shrink-0"
          >
            <option value={0.8}>0.8x Voice</option>
            <option value={1}>1.0x Voice</option>
            <option value={1.25}>1.25x Voice</option>
            <option value={1.5}>1.5x Voice</option>
          </select>
        </div>

        {/* Right: Close player button */}
        <button
          onClick={handleClose}
          className="p-2 bg-white hover:bg-slate-100 border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-[1px] transition-all text-slate-900"
          title="Close Audio Narration"
        >
          <X className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};

export default AudioPlayer;
