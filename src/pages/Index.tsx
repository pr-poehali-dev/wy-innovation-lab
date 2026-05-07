import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

type Page = "home" | "profile" | "search" | "messages" | "notifications" | "categories" | "popular" | "moderation";

const CATEGORIES = [
  { id: 1, name: "Технологии", emoji: "💻", count: 1240 },
  { id: 2, name: "Наука", emoji: "🔬", count: 890 },
  { id: 3, name: "Юмор", emoji: "😄", count: 2100 },
  { id: 4, name: "Политика", emoji: "🏛️", count: 670 },
  { id: 5, name: "Спорт", emoji: "⚽", count: 1500 },
  { id: 6, name: "Путешествия", emoji: "✈️", count: 430 },
];

const POSTS_DATA = [
  {
    id: 1,
    author: "alex_dev",
    category: "Технологии",
    title: "Почему TypeScript вытесняет JavaScript в крупных проектах?",
    body: "Заметил, что всё больше компаний переходят на TypeScript. Какие реальные преимущества вы получили при переходе? Стоит ли игра свеч для небольших команд?",
    likes: 342,
    comments: 87,
    time: "2 часа назад",
    liked: false,
    reported: false,
    tag: "Вопрос",
  },
  {
    id: 2,
    author: "marina_travels",
    category: "Путешествия",
    title: "Лучшие места для цифровых кочевников в 2025 году?",
    body: "Планирую полгода поработать удалённо из разных стран. Что выбрать: Бали, Тбилиси или Лиссабон? Рассказывайте про визы, цены и интернет.",
    likes: 215,
    comments: 63,
    time: "4 часа назад",
    liked: true,
    reported: false,
    tag: "Обсуждение",
  },
  {
    id: 3,
    author: "science_nerd",
    category: "Наука",
    title: "Объясните квантовую запутанность простыми словами",
    body: "Читал много статей, но всё равно не могу понять фундаментально. Кто-то может объяснить так, чтобы даже ребёнок понял?",
    likes: 189,
    comments: 41,
    time: "6 часов назад",
    liked: false,
    reported: false,
    tag: "Вопрос",
  },
  {
    id: 4,
    author: "sport_fan99",
    category: "Спорт",
    title: "Как начать бегать после 40 лет без травм?",
    body: "Хочу заняться бегом, но боюсь нагрузки на суставы. Есть ли программы для начинающих? Какая обувь лучше?",
    likes: 127,
    comments: 58,
    time: "8 часов назад",
    liked: false,
    reported: false,
    tag: "Совет",
  },
  {
    id: 5,
    author: "humor_king",
    category: "Юмор",
    title: "Когда обновил Node.js и всё перестало работать 😅",
    body: "Классика жанра. Поделитесь своими историями о том, как простое обновление превратилось в двухдневный квест.",
    likes: 891,
    comments: 234,
    time: "1 день назад",
    liked: true,
    reported: false,
    tag: "Юмор",
  },
];

const MESSAGES_DATA = [
  { id: 1, user: "marina_travels", text: "Привет! Ты был в Грузии?", time: "10:30", unread: true },
  { id: 2, user: "science_nerd", text: "Спасибо за объяснение!", time: "вчера", unread: false },
  { id: 3, user: "alex_dev", text: "Можешь кинуть ссылку?", time: "вчера", unread: true },
  { id: 4, user: "sport_fan99", text: "Отличный совет про кроссовки", time: "2 дня", unread: false },
];

const NOTIFICATIONS_DATA = [
  { id: 1, type: "like", text: "alex_dev лайкнул ваш пост", time: "5 мин назад", read: false },
  { id: 2, type: "comment", text: "marina_travels прокомментировала: «Согласна полностью!»", time: "20 мин назад", read: false },
  { id: 3, type: "mention", text: "science_nerd упомянул вас в обсуждении", time: "1 час назад", read: false },
  { id: 4, type: "like", text: "humor_king лайкнул ваш комментарий", time: "3 часа назад", read: true },
  { id: 5, type: "system", text: "Добро пожаловать! Настройте профиль", time: "вчера", read: true },
];

const REPORTS_DATA = [
  { id: 1, post: "Как заработать миллион за неделю...", author: "spam_bot_1", reason: "Спам", status: "pending", reports: 12 },
  { id: 2, post: "Политическое высказывание #4523", author: "troll_user", reason: "Оскорбления", status: "pending", reports: 7 },
  { id: 3, post: "Реклама казино 🎰", author: "casino_ads", reason: "Реклама", status: "blocked", reports: 23 },
];

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#DDA0DD", "#98D8C8", "#F7A072"];
  return colors[name.charCodeAt(0) % colors.length];
}

const tagColors: Record<string, string> = {
  Вопрос: "bg-blue-100 text-blue-600",
  Обсуждение: "bg-green-100 text-green-600",
  Юмор: "bg-yellow-100 text-yellow-700",
  Совет: "bg-purple-100 text-purple-600",
};

const notifIcons: Record<string, string> = {
  like: "Heart",
  comment: "MessageSquare",
  mention: "AtSign",
  system: "Bell",
};

function PostCard({
  post,
  onLike,
  onReport,
}: {
  post: (typeof POSTS_DATA)[0];
  onLike: (id: number) => void;
  onReport: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={() => onLike(post.id)}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all ${
              post.liked ? "bg-[#fff0eb] text-[#ff4500]" : "text-gray-400 hover:bg-gray-100 hover:text-[#ff4500]"
            }`}
          >
            <Icon name="ArrowUp" size={16} />
            <span className="text-xs font-bold">{post.likes}</span>
          </button>
          <button className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
            <Icon name="ArrowDown" size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: getAvatarColor(post.author) }}
            >
              {getInitials(post.author)}
            </div>
            <span className="text-xs text-gray-500">{post.author}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400">{post.time}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagColors[post.tag] || "bg-gray-100 text-gray-500"}`}>
              {post.tag}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{post.category}</span>
          </div>

          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">{post.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{post.body}</p>

          <div className="flex items-center gap-3 mt-3">
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
              <Icon name="MessageSquare" size={14} />
              <span>{post.comments} комментариев</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
              <Icon name="Share2" size={14} />
              <span>Поделиться</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors">
              <Icon name="Bookmark" size={14} />
              <span>Сохранить</span>
            </button>
            {!post.reported ? (
              <button
                onClick={onReport}
                className="flex items-center gap-1.5 text-gray-300 hover:text-red-400 text-xs transition-colors ml-auto"
              >
                <Icon name="Flag" size={13} />
              </button>
            ) : (
              <span className="text-xs text-red-400 ml-auto flex items-center gap-1">
                <Icon name="Flag" size={12} />
                Жалоба отправлена
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [posts, setPosts] = useState(POSTS_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);
  const [reports, setReports] = useState(REPORTS_DATA);
  const [reportModal, setReportModal] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMessages = MESSAGES_DATA.filter((m) => m.unread).length;

  const handleLike = (postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  const handleReport = (postId: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reported: true } : p)));
    setReportModal(null);
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleModerationAction = (reportId: number, action: "block" | "dismiss") => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: action === "block" ? "blocked" : "dismissed" } : r))
    );
  };

  const filteredPosts = posts.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const popularPosts = [...posts].sort((a, b) => b.likes - a.likes);

  const navItems: { id: Page; icon: string; label: string; badge?: number }[] = [
    { id: "home", icon: "Home", label: "Главная" },
    { id: "popular", icon: "TrendingUp", label: "Популярное" },
    { id: "categories", icon: "LayoutGrid", label: "Категории" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "messages", icon: "MessageSquare", label: "Сообщения", badge: unreadMessages },
    { id: "notifications", icon: "Bell", label: "Уведомления", badge: unreadCount },
    { id: "moderation", icon: "Shield", label: "Модерация" },
    { id: "profile", icon: "User", label: "Профиль" },
  ];

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
              <input
                type="text"
                placeholder="Поиск по постам..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setActivePage("search");
                  else setActivePage("home");
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActivePage("notifications")}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Icon name="Bell" size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff4500] rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePage("messages")}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Icon name="MessageSquare" size={20} className="text-gray-600" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePage("profile")}
              className="ml-1 w-8 h-8 rounded-full bg-[#ff4500] flex items-center justify-center text-white text-sm font-bold hover:bg-[#e03d00] transition-colors"
            >
              Я
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-6">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activePage === item.id ? "bg-[#fff0eb] text-[#ff4500]" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="relative">
                <Icon name={item.icon} size={18} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff4500] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">

          {/* HOME / SEARCH */}
          {(activePage === "home" || activePage === "search") && (
            <div className="space-y-3">
              {activePage === "search" && searchQuery && (
                <p className="text-sm text-gray-500">
                  Результаты: <strong className="text-gray-800">«{searchQuery}»</strong> — {filteredPosts.length} постов
                </p>
              )}
              {activePage === "home" && (
                <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center text-white font-bold shrink-0">Я</div>
                  <button className="flex-1 text-left px-4 py-2.5 bg-gray-100 rounded-full text-sm text-gray-400 hover:bg-gray-200 transition-colors">
                    Задайте вопрос сообществу...
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Icon name="Image" size={18} className="text-gray-500" />
                  </button>
                </div>
              )}

              {activeCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Категория: <strong className="text-gray-800">{activeCategory}</strong></span>
                  <button onClick={() => setActiveCategory(null)} className="text-xs text-[#ff4500] hover:underline">× сбросить</button>
                </div>
              )}

              {filteredPosts.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Icon name="Search" size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Ничего не найдено</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} onLike={handleLike} onReport={() => setReportModal(post.id)} />
                ))
              )}
            </div>
          )}

          {/* POPULAR */}
          {activePage === "popular" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="TrendingUp" size={20} className="text-[#ff4500]" />
                <h2 className="font-bold text-lg text-gray-900">Популярное сегодня</h2>
              </div>
              {popularPosts.map((post, i) => (
                <div key={post.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0 mt-1">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <PostCard post={post} onLike={handleLike} onReport={() => setReportModal(post.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORIES */}
          {activePage === "categories" && (
            <div>
              <h2 className="font-bold text-lg text-gray-900 mb-4">Все категории</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.name === activeCategory ? null : cat.name);
                      setActivePage("home");
                    }}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-[#ff4500] hover:shadow-sm transition-all group"
                  >
                    <div className="text-2xl mb-2">{cat.emoji}</div>
                    <div className="font-semibold text-gray-800 text-sm group-hover:text-[#ff4500] transition-colors">{cat.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{cat.count.toLocaleString()} постов</div>
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
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Сообщения</h2>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {MESSAGES_DATA.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => setActiveChat(msg.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeChat === msg.id ? "bg-[#fff0eb]" : ""}`}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: getAvatarColor(msg.user) }}
                        >
                          {getInitials(msg.user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{msg.user}</span>
                            <span className="text-xs text-gray-400">{msg.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{msg.text}</p>
                        </div>
                        {msg.unread && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  {activeChat ? (
                    <>
                      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: getAvatarColor(MESSAGES_DATA.find((m) => m.id === activeChat)?.user || "") }}
                        >
                          {getInitials(MESSAGES_DATA.find((m) => m.id === activeChat)?.user || "")}
                        </div>
                        <span className="font-semibold text-gray-800">
                          {MESSAGES_DATA.find((m) => m.id === activeChat)?.user}
                        </span>
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-end gap-3">
                        <div className="self-start bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs">
                          <p className="text-sm text-gray-800">{MESSAGES_DATA.find((m) => m.id === activeChat)?.text}</p>
                        </div>
                        <div className="self-end bg-[#ff4500] rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs">
                          <p className="text-sm text-white">Да, был! Отличная страна 👍</p>
                        </div>
                      </div>
                      <div className="p-3 border-t border-gray-100 flex gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Напишите сообщение..."
                          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4500]"
                        />
                        <button className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center hover:bg-[#e03d00] transition-colors">
                          <Icon name="Send" size={16} className="text-white" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Выберите чат</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activePage === "notifications" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Уведомления</h2>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#ff4500] hover:underline font-medium">
                    Прочитать все
                  </button>
                )}
              </div>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${!notif.read ? "bg-[#fff8f6]" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === "like" ? "bg-red-100 text-red-500" :
                      notif.type === "comment" ? "bg-blue-100 text-blue-500" :
                      notif.type === "mention" ? "bg-purple-100 text-purple-500" :
                      "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Icon name={notifIcons[notif.type]} size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notif.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-[#ff4500] shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}

          {/* PROFILE */}
          {activePage === "profile" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-[#ff4500] to-[#ff6534]" />
                <div className="px-6 pb-6">
                  <div className="flex items-end gap-4 -mt-8 mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white bg-[#ff4500] flex items-center justify-center text-white text-xl font-bold">
                      Я
                    </div>
                    <div className="pb-1">
                      <h2 className="font-bold text-lg text-gray-900">my_username</h2>
                      <p className="text-sm text-gray-500">u/my_username</p>
                    </div>
                    <button className="ml-auto px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Редактировать
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Люблю технологии, путешествия и хорошие вопросы. Здесь с 2024 года.
                  </p>
                  <div className="flex gap-6">
                    {[{ label: "Постов", value: "24" }, { label: "Карма", value: "1.2K" }, { label: "Комментариев", value: "189" }].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Мои посты</h3>
                <div className="space-y-2">
                  {posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{post.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{post.likes} лайков · {post.comments} комментариев</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODERATION */}
          {activePage === "moderation" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Shield" size={20} className="text-[#ff4500]" />
                <h2 className="font-bold text-lg text-gray-900">Панель модерации</h2>
                <Badge className="bg-red-100 text-red-600 border-0 hover:bg-red-100">
                  {reports.filter((r) => r.status === "pending").length} новых
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Жалоб всего", value: reports.length, icon: "Flag", color: "text-orange-500 bg-orange-50" },
                  { label: "На проверке", value: reports.filter((r) => r.status === "pending").length, icon: "Clock", color: "text-blue-500 bg-blue-50" },
                  { label: "Заблокировано", value: reports.filter((r) => r.status === "blocked").length, icon: "Ban", color: "text-red-500 bg-red-50" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.color}`}>
                      <Icon name={s.icon} size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Жалобы пользователей</h3>
                </div>
                {reports.map((report) => (
                  <div key={report.id} className="flex items-start gap-4 p-4 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{report.post}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Автор: {report.author} · Причина: {report.reason} · Жалоб: {report.reports}
                      </p>
                    </div>
                    {report.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModerationAction(report.id, "block")}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-medium"
                        >
                          Заблокировать
                        </button>
                        <button
                          onClick={() => handleModerationAction(report.id, "dismiss")}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          Отклонить
                        </button>
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
              <Icon name="LayoutGrid" size={16} className="text-[#ff4500]" />
              Категории
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.name === activeCategory ? null : cat.name); setActivePage("home"); }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    activeCategory === cat.name ? "bg-[#fff0eb] text-[#ff4500] font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{cat.emoji} {cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </button>
              ))}
              {activeCategory && (
                <button onClick={() => setActiveCategory(null)} className="w-full text-xs text-center text-gray-400 hover:text-gray-600 pt-1">
                  Сбросить фильтр
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Icon name="TrendingUp" size={16} className="text-[#ff4500]" />
              Популярное
            </h3>
            <div className="space-y-2">
              {popularPosts.slice(0, 3).map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => setActivePage("popular")}
                  className="w-full text-left flex gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                >
                  <span className="text-sm font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-xs text-gray-700 font-medium line-clamp-2">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Icon name="Heart" size={10} />
                      {post.likes}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${activePage === item.id ? "text-[#ff4500]" : "text-gray-400"}`}
          >
            <div className="relative">
              <Icon name={item.icon} size={20} />
              {item.badge ? (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#ff4500] rounded-full text-white text-[8px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              ) : null}
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
                <button
                  key={reason}
                  onClick={() => handleReport(reportModal)}
                  className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-[#ff4500] hover:text-[#ff4500] transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setReportModal(null)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
