"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, push, set, onDisconnect } from "firebase/database";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Search, Sparkles, Plus, Users, Check } from "lucide-react";
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

    // ดึงกลุ่มที่ตัวเองอยู่
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    if (targetUid) {
      const chatId = currentUser.uid < targetUid ? `${currentUser.uid}_${targetUid}` : `${targetUid}_${currentUser.uid}`;
      await push(ref(db, `chats/${chatId}`), { text: newMessage, senderId: currentUser.uid, timestamp: Date.now() });
      await push(ref(db, `notifications/${targetUid}`), { senderName: currentUser.displayName, text: newMessage, timestamp: Date.now() });
    } else if (groupId) {
      await push(ref(db, `groupChats/${groupId}`), { text: newMessage, senderId: currentUser.uid, senderName: currentUser.displayName, timestamp: Date.now() });
    }
    setNewMessage("");
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
    if (!currentUser) return;
    await set(ref(db, `notes/${currentUser.uid}`), { text: myNote, userId: currentUser.uid, userName: currentUser.displayName, userPhoto: currentUser.photoURL, timestamp: Date.now() });
    setShowNoteModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen bg-[#F9FAFB] dark:bg-[#0A0F0A]">
      <aside className={`w-full md:w-80 flex-col bg-white dark:bg-[#0D140D] border-r dark:border-green-900/30 ${(targetUid || groupId) ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pb-2">
          <Link href="/"><h1 className="text-xl font-bold text-green-600 mb-6 flex items-center gap-2"><Sparkles /> ibung chat</h1></Link>
          <div className="relative mb-4"><Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><input type="text" placeholder="ค้นหาเพื่อน..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A241A] rounded-xl outline-none text-sm" /></div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pt-10 pb-4 border-b dark:border-green-900/20">
          <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setShowGroupModal(true)}>
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center bg-green-50 text-green-500"><Plus /></div>
            <span className="text-[11px] font-bold text-green-500 mt-1">สร้างกลุ่ม</span>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-1 relative cursor-pointer" onClick={() => setShowNoteModal(true)}>
            <div className="w-16 h-16 rounded-full p-1 relative">
              <img src={currentUser?.photoURL || "/api/placeholder/40/40"} className="w-full h-full rounded-full object-cover" alt="" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-green-800 py-1.5 px-4 rounded-2xl text-[11px] text-gray-800 dark:text-white shadow-lg border border-gray-100 max-w-[120px] truncate z-50">
                {allNotes.find(n => n.userId === currentUser?.uid)?.text || "ทิ้งโน้ต..."}
              </div>
            </div><span className="text-[11px] text-gray-400 font-bold mt-1">คุณ</span>
          </div>
          {allNotes.filter(n => n.userId !== currentUser?.uid).map((n, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 relative">
              <div className="w-16 h-16 rounded-full p-1 relative"><img src={n.userPhoto} className="w-full h-full rounded-full object-cover" alt="" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-green-900 py-1.5 px-4 rounded-2xl text-[11px] shadow-lg max-w-[120px] truncate z-50">{n.text}</div>
              </div><span className="text-[11px] text-gray-500 mt-1">{n.userName}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {myGroups.map(group => (
            <Link href={`/chat?groupId=${group.id}`} key={group.id} className={`flex items-center gap-3 p-2.5 rounded-2xl ${groupId === group.id ? 'bg-green-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-green-900/10'}`}>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-green-600" /></div>
              <span className={`font-bold text-sm truncate ${groupId === group.id ? 'text-white' : ''}`}>{group.name}</span>
            </Link>
          ))}
          {filteredUsers.map(user => (
            <Link href={`/chat?id=${user.uid}`} key={user.uid} className={`flex items-center gap-3 p-2.5 rounded-2xl ${user.uid === targetUid ? 'bg-green-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-green-900/10'}`}>
              <div className="relative flex-shrink-0"><img src={user.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" />{user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}</div>
              <div className="flex flex-col min-w-0"><span className={`font-bold text-sm truncate ${user.uid === targetUid ? 'text-white' : ''}`}>{user.displayName}</span><span className={`text-[10px] ${user.uid === targetUid ? 'text-green-100' : 'text-gray-400'}`}>{user.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</span></div>
            </Link>
          ))}
        </div>
      </aside>

      {(targetUid || groupId) && (
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0A0F0A]">
          <header className="px-6 py-4 flex items-center gap-3 border-b dark:border-green-900/20 bg-white/80 sticky top-0 z-10">
            <Link href="/chat" className="md:hidden"><ArrowLeft className="w-5 h-5" /></Link>
            {targetUser ? <><img src={targetUser?.photoURL} className="w-10 h-10 rounded-full object-cover" alt="" /><h2 className="font-bold">{targetUser?.displayName}</h2></> : <><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div><h2 className="font-bold">{targetGroup?.name}</h2></>}
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                {groupId && msg.senderId !== currentUser?.uid && <span className="text-[10px] text-gray-400 ml-2 mb-1">{msg.senderName}</span>}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] ${msg.senderId === currentUser?.uid ? 'bg-green-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-[#1A241A] rounded-tl-none'}`}>{msg.text}</div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
          <footer className="p-4 bg-white dark:bg-[#0D140D] border-t dark:border-green-900/20">
            <form onSubmit={sendMessage} className="flex gap-3 bg-gray-50 dark:bg-[#1A241A] rounded-2xl px-4 py-2"><input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 bg-transparent outline-none text-sm" /><button type="submit" className="p-2 bg-green-500 text-white rounded-xl"><Send className="w-4 h-4" /></button></form>
          </footer>
        </main>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6"><div className="bg-white dark:bg-[#1A241A] rounded-[2rem] p-8 w-full max-w-sm"><h2 className="text-xl font-bold mb-6">สร้างกลุ่มใหม่</h2><input placeholder="ชื่อกลุ่ม..." value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none mb-4 text-sm" /><div className="max-h-48 overflow-y-auto mb-6 space-y-2">{allUsers.map(u => (<div key={u.uid} onClick={() => setSelectedMembers(p => p.includes(u.uid) ? p.filter(id => id !== u.uid) : [...p, u.uid])} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-50"><img src={u.photoURL} className="w-8 h-8 rounded-full" alt="" /><span className="text-sm flex-1">{u.displayName}</span>{selectedMembers.includes(u.uid) && <Check className="w-4 h-4 text-green-500" />}</div>))}</div><div className="flex gap-3"><button onClick={() => setShowGroupModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">ยกเลิก</button><button onClick={createGroup} disabled={!groupName || selectedMembers.length === 0} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-bold">สร้างเลย</button></div></div></div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6"><div className="bg-white dark:bg-[#1A241A] rounded-[2rem] p-8 w-full max-w-xs"><p className="text-sm font-bold mb-4">เขียนโน้ต...</p><input maxLength={60} value={myNote} onChange={e => setMyNote(e.target.value)} placeholder="คิดอะไรอยู่?" className="w-full p-4 bg-gray-100 rounded-2xl outline-none mb-6 text-sm" /><div className="flex gap-3"><button onClick={() => setShowNoteModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">ยกเลิก</button><button onClick={saveNote} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-bold">แชร์</button></div></div></div>
      )}
    </div>
  );
}

export default function ChatPage() { return ( <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-green-500" /></div>}><ChatContent /></Suspense> ); }