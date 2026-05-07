import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type Page = "home" | "profile" | "search" | "messages" | "notifications" | "categories" | "popular" | "moderation";

const CATEGORIES = [
  { name: "Технологии", emoji: "💻" },
  { name: "Наука", emoji: "🔬" },
  { name: "Юмор", emoji: "😄" },
  { name: "Политика", emoji: "🏛️" },
  { name: "Спорт", emoji: "⚽" },
  { name: "Путешествия", emoji: "✈️" },
  { name: "Общее", emoji: "💬" },
];

const TAGS = ["Вопрос", "Обсуждение", "Совет", "Юмор", "Новость"];

const tagColors: Record<string, string> = {
  Вопрос: "bg-blue-100 text-blue-600",
  Обсуждение: "bg-green-100 text-green-600",
  Юмор: "bg-yellow-100 text-yellow-700",
  Совет: "bg-purple-100 text-purple-600",
  Новость: "bg-orange-100 text-orange-600",
};

function getAvatarColor(name: string, color?: string): string {
  if (color) return color;
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#DDA0DD", "#F7A072", "#98D8C8"];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

function getInitials(name: string): string {
  return (name || "?").slice(0, 2).toUpperCase();
}

type User = { id: number; username: string; email: string; avatar_color: string; bio: string; karma: number; posts_count?: number; comments_count?: number };
type Post = { id: number; title: string; body: string; category: string; tag: string; likes: number; comments: number; time: string; author: string; avatar_color: string; liked: boolean };
type Comment = { id: number; body: string; time: string; author: string; avatar_color: string };
type Dialog = { user_id: number; username: string; avatar_color: string; last_msg: string; time: string; unread: number };
type Message = { id: number; body: string; time: string; sender_id: number; sender: string; avatar_color: string; is_mine: boolean };
type Report = { id: number; post: string; author: string; reason: string; status: string; reports: number };

function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = isLogin ? await api.login(email, password) : await api.register(username, email, password);
      if (res.error) { setError(res.error); }
      else { localStorage.setItem("forum_token", res.token); onAuth(res.user); }
    } catch { setError("Ошибка соединения"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center">
            <span className="text-white font-bold">Ф</span>
          </div>
          <span className="font-bold text-xl text-gray-900">Форум</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{isLogin ? "Добро пожаловать" : "Создать аккаунт"}</h2>
        <p className="text-sm text-gray-500 mb-6">{isLogin ? "Войдите, чтобы участвовать" : "Присоединяйтесь к сообществу"}</p>
        <div className="space-y-3">
          {!isLogin && (
            <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button onClick={submit} disabled={loading}
          className="mt-5 w-full py-3 bg-[#ff4500] text-white rounded-xl font-semibold text-sm hover:bg-[#e03d00] transition-colors disabled:opacity-60">
          {loading ? "Подождите..." : isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
        <p className="mt-4 text-center text-sm text-gray-500">
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-[#ff4500] font-medium hover:underline">
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}

function PostCard({ post, onLike, onReport, onOpenComments }: {
  post: Post; onLike: (id: number) => void; onReport: (id: number) => void; onOpenComments: (p: Post) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <button onClick={() => onLike(post.id)}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all ${post.liked ? "bg-[#fff0eb] text-[#ff4500]" : "text-gray-400 hover:bg-gray-100 hover:text-[#ff4500]"}`}>
            <Icon name="ArrowUp" size={16} />
            <span className="text-xs font-bold">{post.likes}</span>
          </button>
          <button className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
            <Icon name="ArrowDown" size={14} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: getAvatarColor(post.author, post.avatar_color) }}>
              {getInitials(post.author)}
            </div>
            <span className="text-xs text-gray-500">{post.author}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400">{post.time}</span>
            {post.tag && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagColors[post.tag] || "bg-gray-100 text-gray-500"}`}>{post.tag}</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{post.category}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">{post.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{post.body}</p>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => onOpenComments(post)} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
              <Icon name="MessageSquare" size={14} /><span>{post.comments} комментариев</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
              <Icon name="Share2" size={14} /><span>Поделиться</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
              <Icon name="Bookmark" size={14} /><span>Сохранить</span>
            </button>
            <button onClick={() => onReport(post.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
              <Icon name="Flag" size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentsModal({ post, currentUser, onClose }: { post: Post; currentUser: User; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getComments(post.id).then((r) => { setComments(r.comments || []); setLoading(false); });
  }, [post.id]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const res = await api.addComment(post.id, text.trim());
    if (!res.error) {
      setComments((prev) => [...prev, { id: res.id, body: text.trim(), time: "только что", author: currentUser.username, avatar_color: currentUser.avatar_color }]);
      setText("");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{post.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"><Icon name="X" size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && <p className="text-sm text-gray-400 text-center py-4">Загрузка...</p>}
          {!loading && comments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Нет комментариев. Будьте первым!</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: getAvatarColor(c.author, c.avatar_color) }}>
                {getInitials(c.author)}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{c.author}</span>
                  <span className="text-xs text-gray-400">{c.time}</span>
                </div>
                <p className="text-sm text-gray-700">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Написать комментарий..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
          <button onClick={send} disabled={sending || !text.trim()}
            className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center hover:bg-[#e03d00] transition-colors disabled:opacity-50">
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Общее");
  const [tag, setTag] = useState("Обсуждение");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) { setError("Заполните заголовок и текст"); return; }
    setLoading(true);
    const res = await api.createPost(title.trim(), body.trim(), category, tag);
    if (res.error) { setError(res.error); setLoading(false); return; }
    onCreated(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg">Создать пост</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input type="text" placeholder="Заголовок *" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
          <textarea placeholder="Текст поста *" value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500] resize-none" />
          <div className="flex gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]">
              {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
            </select>
            <select value={tag} onChange={(e) => setTag(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]">
              {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full py-3 bg-[#ff4500] text-white rounded-xl font-semibold text-sm hover:bg-[#e03d00] transition-colors disabled:opacity-60">
            {loading ? "Публикую..." : "Опубликовать"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activePage, setActivePage] = useState<Page>("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [online, setOnline] = useState(0);
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [activeChat, setActiveChat] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [reportModal, setReportModal] = useState<number | null>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: number; username: string; avatar_color: string }[]>([]);
  const [editBio, setEditBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("forum_token");
    if (!token) { setAuthChecked(true); return; }
    api.me().then((res) => {
      if (res.user) setUser(res.user);
      else localStorage.removeItem("forum_token");
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const tick = () => api.online().then((r) => setOnline(r.online || 0));
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    const res = await api.getPosts({
      category: activeCategory || undefined,
      search: searchQuery || undefined,
      sort: activePage === "popular" ? "top" : "new",
    });
    setPosts(res.posts || []);
    setPostsLoading(false);
  }, [activeCategory, searchQuery, activePage]);

  useEffect(() => {
    if (user && (activePage === "home" || activePage === "popular" || activePage === "search")) loadPosts();
  }, [user, activePage, activeCategory, loadPosts]);

  useEffect(() => {
    if (user && activePage === "messages") api.getDialogs().then((r) => setDialogs(r.dialogs || []));
    if (user && activePage === "moderation") api.getReports().then((r) => setReports(r.reports || []));
  }, [user, activePage]);

  useEffect(() => {
    if (activeChat) {
      api.getMessages(activeChat.user_id).then((r) => {
        setMessages(r.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
    }
  }, [activeChat]);

  const handleLike = async (postId: number) => {
    const res = await api.likePost(postId);
    if (!res.error) setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: res.liked, likes: res.likes } : p));
  };

  const handleReport = async (postId: number, reason: string) => {
    await api.reportPost(postId, reason);
    setReportModal(null);
  };

  const handleSendMsg = async () => {
    if (!chatMsg.trim() || !activeChat || !user) return;
    const res = await api.sendMessage(activeChat.user_id, chatMsg.trim());
    if (!res.error) {
      setMessages((prev) => [...prev, { id: res.id, body: chatMsg.trim(), time: "только что", sender_id: user.id, sender: user.username, avatar_color: user.avatar_color, is_mine: true }]);
      setChatMsg("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const handleModerationAction = async (reportId: number, action: "blocked" | "dismissed") => {
    await api.moderate(reportId, action);
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: action } : r));
  };

  const handleUserSearch = async (q: string) => {
    setUserSearch(q);
    if (q.length >= 2) { const res = await api.searchUsers(q); setUserResults(res.users || []); }
    else setUserResults([]);
  };

  const handleSaveBio = async () => {
    setProfileLoading(true);
    await api.updateProfile(editBio);
    if (user) setUser({ ...user, bio: editBio });
    setEditingBio(false);
    setProfileLoading(false);
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem("forum_token");
    setUser(null);
  };

  const unreadMessages = dialogs.reduce((sum, d) => sum + (d.unread || 0), 0);
  const shownPosts = activePage === "popular" ? [...posts].sort((a, b) => b.likes - a.likes) : posts;

  const navItems: { id: Page; icon: string; label: string; badge?: number }[] = [
    { id: "home", icon: "Home", label: "Главная" },
    { id: "popular", icon: "TrendingUp", label: "Популярное" },
    { id: "categories", icon: "LayoutGrid", label: "Категории" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "messages", icon: "MessageSquare", label: "Сообщения", badge: unreadMessages },
    { id: "moderation", icon: "Shield", label: "Модерация" },
    { id: "profile", icon: "User", label: "Профиль" },
  ];

  if (!authChecked) return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#ff4500] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <AuthScreen onAuth={(u) => setUser(u)} />;

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage("home")}>
            <div className="w-8 h-8 rounded-full bg-[#ff4500] flex items-center justify-center">
              <span className="text-white text-sm font-bold">Ф</span>
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Форум</span>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Поиск по постам..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActivePage("search"); }}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500] focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {online > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-700 font-medium">{online} онлайн</span>
              </div>
            )}
            <button onClick={() => setActivePage("messages")} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Icon name="MessageSquare" size={20} className="text-gray-600" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{unreadMessages}</span>
              )}
            </button>
            <button onClick={() => setActivePage("profile")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: user.avatar_color }}>
              {getInitials(user.username)}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-6">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activePage === item.id ? "bg-[#fff0eb] text-[#ff4500]" : "text-gray-600 hover:bg-gray-100"}`}>
              <div className="relative">
                <Icon name={item.icon} size={18} />
                {item.badge ? <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff4500] rounded-full text-white text-[9px] flex items-center justify-center font-bold">{item.badge}</span> : null}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
          {online > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-700 font-medium">{online} онлайн</span>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">

          {/* HOME / POPULAR / SEARCH */}
          {(activePage === "home" || activePage === "popular" || activePage === "search") && (
            <div className="space-y-3">
              {activePage === "popular" && (
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="TrendingUp" size={20} className="text-[#ff4500]" />
                  <h2 className="font-bold text-lg text-gray-900">Популярное</h2>
                </div>
              )}
              {activePage === "home" && (
                <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: user.avatar_color }}>
                    {getInitials(user.username)}
                  </div>
                  <button onClick={() => setCreateModal(true)} className="flex-1 text-left px-4 py-2.5 bg-gray-100 rounded-full text-sm text-gray-400 hover:bg-gray-200 transition-colors">
                    Задайте вопрос сообществу...
                  </button>
                  <button onClick={() => setCreateModal(true)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Icon name="PlusCircle" size={20} className="text-[#ff4500]" />
                  </button>
                </div>
              )}
              {activeCategory && activePage === "home" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Категория: <strong className="text-gray-800">{activeCategory}</strong></span>
                  <button onClick={() => setActiveCategory(null)} className="text-xs text-[#ff4500] hover:underline">× сбросить</button>
                </div>
              )}
              {postsLoading ? (
                <div className="py-12 text-center"><div className="w-8 h-8 border-2 border-[#ff4500] border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : shownPosts.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>{searchQuery ? "Ничего не найдено" : "Постов нет. Создайте первый!"}</p>
                  {!searchQuery && (
                    <button onClick={() => setCreateModal(true)} className="mt-3 px-5 py-2 bg-[#ff4500] text-white rounded-full text-sm font-medium hover:bg-[#e03d00] transition-colors">
                      Создать пост
                    </button>
                  )}
                </div>
              ) : (
                shownPosts.map((post, i) => (
                  <div key={post.id} className={activePage === "popular" ? "flex items-start gap-3" : ""}>
                    {activePage === "popular" && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0 mt-1">{i + 1}</div>
                    )}
                    <div className={activePage === "popular" ? "flex-1" : ""}>
                      <PostCard post={post} onLike={handleLike} onReport={(id) => setReportModal(id)} onOpenComments={(p) => setCommentsPost(p)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {activePage === "categories" && (
            <div>
              <h2 className="font-bold text-lg text-gray-900 mb-4">Все категории</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button key={cat.name} onClick={() => { setActiveCategory(cat.name); setActivePage("home"); }}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-[#ff4500] hover:shadow-sm transition-all group">
                    <div className="text-2xl mb-2">{cat.emoji}</div>
                    <div className="font-semibold text-gray-800 text-sm group-hover:text-[#ff4500] transition-colors">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {activePage === "messages" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex h-[520px]">
                <div className="w-64 border-r border-gray-100 flex flex-col shrink-0">
                  <div className="p-3 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 mb-2">Сообщения</h2>
                    <div className="relative">
                      <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Найти пользователя..." value={userSearch} onChange={(e) => handleUserSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
                    </div>
                    {userResults.length > 0 && (
                      <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        {userResults.map((u) => (
                          <button key={u.id}
                            onClick={() => { setActiveChat({ user_id: u.id, username: u.username, avatar_color: u.avatar_color, last_msg: "", time: "", unread: 0 }); setUserSearch(""); setUserResults([]); }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: getAvatarColor(u.username, u.avatar_color) }}>
                              {getInitials(u.username)}
                            </div>
                            <span className="text-sm text-gray-700">{u.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {dialogs.length === 0 && <p className="text-xs text-gray-400 text-center p-4">Нет диалогов. Найдите пользователя выше.</p>}
                    {dialogs.map((d) => (
                      <button key={d.user_id} onClick={() => setActiveChat(d)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeChat?.user_id === d.user_id ? "bg-[#fff0eb]" : ""}`}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: getAvatarColor(d.username, d.avatar_color) }}>
                          {getInitials(d.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{d.username}</span>
                            <span className="text-xs text-gray-400">{d.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{d.last_msg}</p>
                        </div>
                        {d.unread > 0 && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  {activeChat ? (
                    <>
                      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: getAvatarColor(activeChat.username, activeChat.avatar_color) }}>
                          {getInitials(activeChat.username)}
                        </div>
                        <span className="font-semibold text-gray-800">{activeChat.username}</span>
                      </div>
                      <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                        {messages.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Начните переписку!</p>}
                        {messages.map((m) => (
                          <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
                            <div className={`px-4 py-2 rounded-2xl max-w-xs ${m.is_mine ? "bg-[#ff4500] text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                              <p className="text-sm">{m.body}</p>
                              <p className={`text-[10px] mt-0.5 ${m.is_mine ? "text-orange-200" : "text-gray-400"}`}>{m.time}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="p-3 border-t border-gray-100 flex gap-2">
                        <input type="text" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
                          placeholder="Напишите сообщение..."
                          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]" />
                        <button onClick={handleSendMsg} disabled={!chatMsg.trim()}
                          className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center hover:bg-[#e03d00] transition-colors disabled:opacity-50">
                          <Icon name="Send" size={16} className="text-white" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Выберите чат или найдите пользователя</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activePage === "profile" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-24" style={{ background: `linear-gradient(135deg, ${user.avatar_color}, #ff4500)` }} />
                <div className="px-6 pb-6">
                  <div className="flex items-end gap-4 -mt-8 mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: user.avatar_color }}>
                      {getInitials(user.username)}
                    </div>
                    <div className="pb-1">
                      <h2 className="font-bold text-lg text-gray-900">{user.username}</h2>
                      <p className="text-sm text-gray-500">u/{user.username}</p>
                    </div>
                    <button onClick={handleLogout} className="ml-auto px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Выйти
                    </button>
                  </div>
                  {editingBio ? (
                    <div className="mb-4 space-y-2">
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500] resize-none"
                        placeholder="Расскажите о себе..." />
                      <div className="flex gap-2">
                        <button onClick={handleSaveBio} disabled={profileLoading} className="px-4 py-1.5 bg-[#ff4500] text-white rounded-full text-sm font-medium hover:bg-[#e03d00] disabled:opacity-60">Сохранить</button>
                        <button onClick={() => setEditingBio(false)} className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 flex items-start gap-2">
                      <p className="text-sm text-gray-600 flex-1">{user.bio || "Нет описания"}</p>
                      <button onClick={() => { setEditBio(user.bio || ""); setEditingBio(true); }} className="text-gray-400 hover:text-[#ff4500] transition-colors shrink-0">
                        <Icon name="Pencil" size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-6">
                    {[{ label: "Постов", value: user.posts_count ?? 0 }, { label: "Карма", value: user.karma }, { label: "Комментариев", value: user.comments_count ?? 0 }].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="font-bold text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => { setActivePage("home"); setCreateModal(true); }}
                className="w-full py-3 bg-[#ff4500] text-white rounded-xl font-semibold text-sm hover:bg-[#e03d00] transition-colors flex items-center justify-center gap-2">
                <Icon name="PlusCircle" size={18} />Создать пост
              </button>
            </div>
          )}

          {/* MODERATION */}
          {activePage === "moderation" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Shield" size={20} className="text-[#ff4500]" />
                <h2 className="font-bold text-lg text-gray-900">Модерация</h2>
                <Badge className="bg-red-100 text-red-600 border-0 hover:bg-red-100">{reports.filter((r) => r.status === "pending").length} новых</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Всего", value: reports.length, icon: "Flag", color: "text-orange-500 bg-orange-50" },
                  { label: "На проверке", value: reports.filter((r) => r.status === "pending").length, icon: "Clock", color: "text-blue-500 bg-blue-50" },
                  { label: "Заблокировано", value: reports.filter((r) => r.status === "blocked").length, icon: "Ban", color: "text-red-500 bg-red-50" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.color}`}><Icon name={s.icon} size={18} /></div>
                    <div><div className="font-bold text-gray-900">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Жалобы пользователей</h3></div>
                {reports.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Жалоб нет</p>}
                {reports.map((report) => (
                  <div key={report.id} className="flex items-start gap-4 p-4 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{report.post}</p>
                      <p className="text-xs text-gray-500 mt-1">Автор: {report.author} · Причина: {report.reason} · Жалоб: {report.reports}</p>
                    </div>
                    {report.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleModerationAction(report.id, "blocked")} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-medium">Заблокировать</button>
                        <button onClick={() => handleModerationAction(report.id, "dismissed")} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium">Отклонить</button>
                      </div>
                    ) : (
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${report.status === "blocked" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                        {report.status === "blocked" ? "Заблокирован" : "Отклонено"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:flex flex-col gap-4 w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Icon name="LayoutGrid" size={16} className="text-[#ff4500]" />Категории
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button key={cat.name}
                  onClick={() => { setActiveCategory(cat.name === activeCategory ? null : cat.name); setActivePage("home"); }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${activeCategory === cat.name ? "bg-[#fff0eb] text-[#ff4500] font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                  <span>{cat.emoji} {cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setCreateModal(true)}
            className="w-full py-3 bg-[#ff4500] text-white rounded-xl font-semibold text-sm hover:bg-[#e03d00] transition-colors flex items-center justify-center gap-2">
            <Icon name="PlusCircle" size={18} />Создать пост
          </button>
        </aside>
      </div>

      {/* Mobile nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {navItems.slice(0, 5).map((item) => (
          <button key={item.id} onClick={() => setActivePage(item.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${activePage === item.id ? "text-[#ff4500]" : "text-gray-400"}`}>
            <div className="relative">
              <Icon name={item.icon} size={20} />
              {item.badge ? <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#ff4500] rounded-full text-white text-[8px] flex items-center justify-center font-bold">{item.badge}</span> : null}
            </div>
            <span className="text-[9px]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Report Modal */}
      {reportModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setReportModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Пожаловаться на пост</h3>
            <p className="text-sm text-gray-500 mb-4">Выберите причину жалобы</p>
            <div className="space-y-2 mb-4">
              {["Спам", "Оскорбления", "Дезинформация", "Неприемлемый контент", "Другое"].map((reason) => (
                <button key={reason} onClick={() => handleReport(reportModal, reason)}
                  className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-[#ff4500] hover:text-[#ff4500] transition-colors">
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => setReportModal(null)} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors font-medium">Отмена</button>
          </div>
        </div>
      )}

      {commentsPost && <CommentsModal post={commentsPost} currentUser={user} onClose={() => setCommentsPost(null)} />}
      {createModal && <CreatePostModal onClose={() => setCreateModal(false)} onCreated={loadPosts} />}
    </div>
  );
}
