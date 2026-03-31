"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, set, onDisconnect } from "firebase/database";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Search, Sparkles, Plus, Users, Check, Phone, Video, Mic, Square, Smile, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUid = searchParams.get("id");
  const groupId = searchParams.get("groupId");
  const currentUser = auth.currentUser;
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [targetGroup, setTargetGroup] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [myNote, setMyNote] = useState("");
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // 🎯 UI & Feature States
  const [showGiphy, setShowGiphy] = useState(false);
  const [giphySearch, setGiphySearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const filteredUsers = allUsers.filter(user => user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    const myStatusRef = ref(db, `status/${currentUser.uid}`);
    set(myStatusRef, "online");
    onDisconnect(myStatusRef).set("offline");

    onValue(ref(db, 'users'), (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        onValue(ref(db, 'status'), (statusSnap) => {
          const statusData = statusSnap.val() || {};
          const usersList = Object.values(usersData)
            .filter((u: any) => u.uid !== currentUser.uid)
            .map((u: any) => ({ ...u, isOnline: statusData[u.uid] === "online" }));
          setAllUsers(usersList);
        });
      }
    });

    onValue(ref(db, 'groups'), (snapshot) => {
      const groupsData = snapshot.val();
      if (groupsData) {
        const userGroups = Object.values(groupsData).filter((g: any) => g.members?.includes(currentUser.uid));
        setMyGroups(userGroups);
      }
    });

    onValue(ref(db, 'notes'), s => setAllNotes(s.val() ? Object.values(s.val()) : []));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (targetUid) {
      onValue(ref(db, `users/${targetUid}`), (snapshot) => setTargetUser(snapshot.val()));
      setTargetGroup(null);
      const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
      return onValue(ref(db, `chats/${chatId}`), (snapshot) => {
        const data = snapshot.val();
        setMessages(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
      });
    } else if (groupId) {
      onValue(ref(db, `groups/${groupId}`), (snapshot) => setTargetGroup(snapshot.val()));
      setTargetUser(null);
      return onValue(ref(db, `groupChats/${groupId}`), (snapshot) => {
        const data = snapshot.val();
        setMessages(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
      });
    }
  }, [currentUser, targetUid, groupId]);

  useEffect(() => {
    if (showGiphy) {
      const fetchGifs = async () => {
        const query = giphySearch.trim() || "trending";
        try {
          const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=9ugBrU9i1uJi5LhXKJFtxbVb0bbpHmQV&q=${query}&limit=20`);
          const { data } = await res.json();
          setGifs(data || []);
        } catch (error) { console.error("Giphy API Error:", error); }
      };
      const debounce = setTimeout(() => fetchGifs(), 500);
      return () => clearTimeout(debounce);
    }
  }, [giphySearch, showGiphy]);

  const sendGif = async (url: string) => {
    if (!currentUser) return;
    setShowGiphy(false);
    setGiphySearch("");
    if (targetUid) {
      const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
      await push(ref(db, `chats/${chatId}`), { type: 'gif', url, senderId: currentUser.uid, timestamp: Date.now() });
    } else if (groupId) {
      await push(ref(db, `groupChats/${groupId}`), { type: 'gif', url, senderId: currentUser.uid, senderName: currentUser.displayName, timestamp: Date.now() });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setIsUploadingImg(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://api.imgbb.com/1/upload?key=fd4168dbacd1e283e3e1158bfbb36028", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        const imageUrl = data.data.url;
        if (targetUid) {
          const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
          await push(ref(db, `chats/${chatId}`), { type: 'image', url: imageUrl, senderId: currentUser.uid, timestamp: Date.now() });
        } else if (groupId) {
          await push(ref(db, `groupChats/${groupId}`), { type: 'image', url: imageUrl, senderId: currentUser.uid, senderName: currentUser.displayName, timestamp: Date.now() });
        }
      }
    } catch (error) {
      alert("อัปโหลดรูปไม่สำเร็จครับ");
    } finally {
      setIsUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      }

      mediaRecorder.current = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '' });
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType }); 
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob); 
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          if (!currentUser) return;
          if (targetUid) {
            const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
            await push(ref(db, `chats/${chatId}`), { type: 'voice', url: base64Audio, senderId: currentUser.uid, timestamp: Date.now() });
          } else if (groupId) {
            await push(ref(db, `groupChats/${groupId}`), { type: 'voice', url: base64Audio, senderId: currentUser.uid, senderName: currentUser.displayName, timestamp: Date.now() });
          }
        };
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { alert("กรุณาอนุญาตให้ใช้งานไมโครโฟน"); }
  };

  const stopRecording = () => { mediaRecorder.current?.stop(); setIsRecording(false); };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    if (targetUid) {
      const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
      await push(ref(db, `chats/${chatId}`), { type: 'text', text: newMessage, senderId: currentUser.uid, timestamp: Date.now() });
      await push(ref(db, `notifications/${targetUid}`), { senderName: currentUser.displayName, text: newMessage, timestamp: Date.now() });
    } else if (groupId) {
      await push(ref(db, `groupChats/${groupId}`), { type: 'text', text: newMessage, senderId: currentUser.uid, senderName: currentUser.displayName, timestamp: Date.now() });
    }
    setNewMessage("");
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!currentUser) return;
    const isGroup = !!groupId; 
    const roomCallId = targetUid 
      ? (currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`)
      : groupId;

    const callLink = `/call/${roomCallId}?type=${type}&isGroup=${isGroup}`;

    if (targetUid) {
      await push(ref(db, `chats/${roomCallId}`), { text: type === 'video' ? 'วิดีโอคอลหาคุณ..' : 'โทรด้วยเสียงหาคุณ..', senderId: currentUser.uid, timestamp: Date.now(), isCall: true, callType: type, callLink });
      await push(ref(db, `notifications/${targetUid}`), { senderName: currentUser.displayName, text: `กำลังโทรหาคุณ...`, timestamp: Date.now() });
    } else if (groupId) {
      await push(ref(db, `groupChats/${groupId}`), { text: type === 'video' ? 'วิดีโอคอลกลุ่ม..' : 'โทรด้วยเสียงกลุ่ม..', senderId: currentUser.uid, senderName: currentUser.displayName, timestamp: Date.now(), isCall: true, callType: type, callLink });
    }
    router.push(callLink);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0 || !currentUser) return;
    const newGroupRef = push(ref(db, 'groups'));
    const gId = newGroupRef.key;
    await set(newGroupRef, { id: gId, name: groupName, members: [currentUser.uid, ...selectedMembers], createdBy: currentUser.uid, timestamp: Date.now() });
    setShowGroupModal(false); setGroupName(""); setSelectedMembers([]);
    router.push(`/chat?groupId=${gId}`);
  };

  const saveNote = async () => {
    if (!currentUser || !myNote.trim()) return;
    await set(ref(db, `notes/${currentUser.uid}`), { 
      text: myNote, 
      userId: currentUser.uid, 
      userName: currentUser.displayName || "User", 
      userPhoto: currentUser.photoURL || "/api/placeholder/40/40", 
      timestamp: Date.now() 
    });
    setMyNote(""); 
    setShowNoteModal(false); 
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A]">
      <aside className={`w-full md:w-80 flex-col bg-white dark:bg-[#0D140D] border-r dark:border-green-900/30 ${(targetUid || groupId) ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <Link href="/"><h1 className="text-xl font-bold text-green-600 mb-6 flex items-center gap-2"><Sparkles /> ibung chat</h1></Link>
          <div className="relative mb-4"><Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><input type="text" placeholder="ค้นหาเพื่อน..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A241A] rounded-xl outline-none text-sm" /></div>
        </div>

        <div className="flex gap-4 overflow-x-auto px-4 pt-12 pb-4 border-b dark:border-green-900/20 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer w-[60px]" onClick={() => setShowGroupModal(true)}>
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center bg-green-50 text-green-500"><Plus size={20} /></div>
            <span className="text-[10px] font-bold text-green-500 mt-1 w-full text-center truncate">สร้างกลุ่ม</span>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer w-[60px] relative" onClick={() => setShowNoteModal(true)}>
            <div className="w-14 h-14 rounded-full p-0.5 border-2 border-green-500"><img src={currentUser?.photoURL || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" /></div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1A241A] text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-green-900/50 py-1.5 px-3 rounded-2xl text-[10px] shadow-md w-max max-w-[80px] truncate z-50">
              {allNotes.find(n => n.userId === currentUser?.uid)?.text || "+ ทิ้งโน้ต"}
            </div>
            <span className="text-[10px] text-gray-400 font-bold mt-1 w-full text-center truncate">คุณ</span>
          </div>

          {allNotes.filter(n => n.userId !== currentUser?.uid).map((n, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 w-[60px] relative">
              <div className="w-14 h-14 rounded-full p-0.5 border-2 border-transparent dark:border-green-900/30">
                <img src={n.userPhoto || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" />
              </div>
              {n.text && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1A241A] text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-green-900/50 py-1.5 px-3 rounded-2xl text-[10px] shadow-md w-max max-w-[80px] truncate z-50">
                  {n.text}
                </div>
              )}
              <span className="text-[10px] text-gray-500 mt-1 w-full text-center truncate">{n.userName}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {myGroups.map(group => (
            <Link href={`/chat?groupId=${group.id}`} key={group.id} className={`flex items-center gap-3 p-2.5 rounded-2xl ${groupId === group.id ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-green-900/10'}`}>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-green-600" /></div>
              <span className={`font-bold text-sm truncate ${groupId === group.id ? 'text-white' : ''}`}>{group.name}</span>
            </Link>
          ))}
          {filteredUsers.map(user => (
            <Link href={`/chat?id=${user.uid}`} key={user.uid} className={`flex items-center gap-3 p-2.5 rounded-2xl ${user.uid === targetUid ? 'bg-green-500 text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-green-900/10'}`}>
              <div className="relative flex-shrink-0"><img src={user.photoURL} className="w-10 h-10 rounded-full object-cover border dark:border-green-900/30" alt="" />{user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}</div>
              <div className="flex flex-col min-w-0"><span className={`font-bold text-sm truncate ${user.uid === targetUid ? 'text-white' : ''}`}>{user.displayName}</span></div>
            </Link>
          ))}
        </div>
      </aside>

      {(targetUid || groupId) && (
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0A0F0A] relative">
          <header className="px-6 py-4 flex items-center justify-between border-b dark:border-green-900/20 bg-white/80 dark:bg-[#0A0F0A]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Link href="/chat" className="md:hidden"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
              {targetUser ? (
                <><img src={targetUser?.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" /><h2 className="font-bold">{targetUser?.displayName}</h2></>
              ) : (
                <><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div><h2 className="font-bold">{targetGroup?.name}</h2></>
              )}
            </div>
            
            <div className="flex items-center gap-5 text-green-600 dark:text-green-500">
              <button onClick={() => startCall('audio')} className="hover:opacity-70 hover:scale-110 active:scale-90 transition-all"><Phone className="w-5 h-5" /></button>
              <button onClick={() => startCall('video')} className="hover:opacity-70 hover:scale-110 active:scale-90 transition-all"><Video className="w-6 h-6" /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              // 🎯 ดักจับประเภท call_end ให้อยู่ตรงกลางจอ
              <div key={msg.id} className={`flex flex-col ${msg.type === 'call_end' ? 'items-center' : msg.senderId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                {groupId && msg.senderId !== currentUser?.uid && msg.type !== 'call_end' && <span className="text-[10px] text-gray-400 ml-2 mb-1">{msg.senderName}</span>}
                
                {/* 🎯 กล่องสิ้นสุดการโทร (ลอยอยู่ตรงกลางแชท) */}
                {msg.type === 'call_end' ? (
                  <div className="bg-gray-100 dark:bg-[#1A241A] text-gray-500 dark:text-gray-400 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 my-2 shadow-sm border dark:border-green-900/30">
                    <Phone size={14} className="text-gray-400" /> 
                    <span className="font-medium">{msg.text}</span>
                  </div>
                ) : msg.isCall ? (
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] flex flex-col gap-3 shadow-md ${msg.senderId === currentUser?.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#1A241A] text-gray-900 dark:text-gray-100 border dark:border-green-900/30 rounded-tl-none'}`}>
                    <div className="flex items-center gap-2 font-bold">{msg.callType === 'video' ? <Video size={18} /> : <Phone size={18} />}{msg.text}</div>
                    
                    <Link href={msg.callLink} className={`text-center py-2 px-6 rounded-xl font-bold shadow-sm transition-all active:scale-95 ${msg.senderId === currentUser?.uid ? 'bg-white text-green-600 hover:bg-green-50' : 'bg-green-500 text-white hover:bg-green-400 animate-pulse'}`}>
                      📞 เข้าร่วม
                    </Link>
                  </div>
                ) : (
                  <div className={`max-w-[75%] p-3 rounded-2xl text-[14px] ${msg.senderId === currentUser?.uid ? 'bg-green-600 text-white rounded-tr-none shadow-md' : 'bg-gray-100 text-gray-900 dark:bg-[#1A241A] dark:text-gray-100 rounded-tl-none shadow-sm'}`}>
                    {msg.type === 'image' && <img src={msg.url} className="rounded-lg max-w-[200px] md:max-w-[300px]" alt="uploaded" />}
                    {msg.type === 'gif' && <img src={msg.url} className="rounded-lg max-w-[200px]" alt="gif" />}
                    {msg.type === 'voice' && (
                      <audio controls className="w-[200px] h-[40px] outline-none"><source src={msg.url} /></audio>
                    )}
                    {(!msg.type || msg.type === 'text') && <p className="px-1 break-words">{msg.text}</p>}
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <footer className="p-4 bg-white dark:bg-[#0D140D] border-t dark:border-green-900/20 relative">
            {showGiphy && (
              <div className="absolute bottom-[80px] left-4 right-4 md:w-80 bg-white dark:bg-[#1A241A] p-4 rounded-3xl shadow-2xl border dark:border-green-900/30 z-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">ส่ง GIF</span>
                  <button onClick={() => setShowGiphy(false)}><X size={18} className="text-gray-400 hover:text-red-500" /></button>
                </div>
                <input type="text" placeholder="ค้นหา GIF..." className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#0D140D] text-gray-900 dark:text-white mb-3 outline-none text-sm" onChange={e => setGiphySearch(e.target.value)} />
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {gifs.length > 0 ? gifs.map(g => (
                    <img key={g.id} src={g.images.fixed_height_small.url} className="h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 active:scale-95 transition-all" onClick={() => sendGif(g.images.fixed_height.url)} alt="gif" />
                  )) : (
                    <p className="text-gray-400 text-xs w-full text-center">พิมพ์ค้นหา...</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 bg-gray-50 dark:bg-[#1A241A] rounded-full px-4 py-2 items-center">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-green-500 transition-colors relative">
                {isUploadingImg ? <Loader2 size={22} className="animate-spin text-green-500" /> : <ImageIcon size={22} />}
              </button>

              <button onClick={() => setShowGiphy(!showGiphy)} className={`transition-colors ${showGiphy ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}><Smile size={22} /></button>
              
              <form onSubmit={sendMessage} className="flex-1">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="w-full bg-transparent text-gray-900 dark:text-white outline-none text-sm" />
              </form>
              
              {isRecording ? (
                <button onClick={stopRecording} className="text-red-500 animate-pulse bg-red-100 dark:bg-red-900/30 p-2 rounded-full"><Square size={16} fill="currentColor" /></button>
              ) : (
                <button onClick={startRecording} className="text-gray-400 hover:text-green-500 p-2"><Mic size={20} /></button>
              )}
              
              <button onClick={sendMessage} className="p-2 bg-green-500 text-white rounded-full ml-1"><Send size={16} /></button>
            </div>
          </footer>
        </main>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"><div className="bg-white dark:bg-[#1A241A] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl"><h2 className="text-xl font-bold mb-6 text-green-600">สร้างกลุ่มใหม่</h2><input placeholder="ชื่อกลุ่ม..." value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-[#0D140D] text-gray-900 dark:text-white rounded-2xl outline-none mb-4 text-sm" /><p className="text-xs font-bold text-gray-400 mb-2">เลือกสมาชิก ({selectedMembers.length})</p><div className="max-h-48 overflow-y-auto mb-6 space-y-2 pr-2">{allUsers.map(u => (<div key={u.uid} onClick={() => setSelectedMembers(p => p.includes(u.uid) ? p.filter(id => id !== u.uid) : [...p, u.uid])} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${selectedMembers.includes(u.uid) ? 'bg-green-50 dark:bg-green-900/20' : ''}`}><img src={u.photoURL} className="w-8 h-8 rounded-full object-cover" alt="" /><span className="text-sm flex-1 text-gray-900 dark:text-white">{u.displayName}</span>{selectedMembers.includes(u.uid) && <Check className="w-4 h-4 text-green-500" />}</div>))}</div><div className="flex gap-3"><button onClick={() => setShowGroupModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">ยกเลิก</button><button onClick={createGroup} disabled={!groupName || selectedMembers.length === 0} className="flex-1 py-3 bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold">สร้างเลย</button></div></div></div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"><div className="bg-white dark:bg-[#1A241A] rounded-[2rem] p-8 w-full max-w-xs shadow-2xl"><p className="text-sm font-bold text-gray-900 dark:text-white mb-4">เขียนโน้ตแชร์ความรู้สึก...</p><input maxLength={60} value={myNote} onChange={e => setMyNote(e.target.value)} placeholder="กำลังทำอะไรอยู่?" className="w-full p-4 bg-gray-100 dark:bg-[#0D140D] text-gray-900 dark:text-white rounded-2xl outline-none mb-6 text-sm" /><div className="flex gap-3"><button onClick={() => setShowNoteModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">ยกเลิก</button><button onClick={saveNote} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-bold">แชร์</button></div></div></div>
      )}
    </div>
  );
}

export default function ChatPage() { return <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>}><ChatContent /></Suspense>; }
