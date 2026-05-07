const AUTH_URL = "https://functions.poehali.dev/67f71c86-b923-4c87-9d9f-f2f00de71ef5";
const POSTS_URL = "https://functions.poehali.dev/a4bfabb6-5bb7-4c63-a8b6-97183d30db1d";
const CHAT_URL = "https://functions.poehali.dev/9ce0665a-7669-4bb8-a360-18c79f896628";

function getToken(): string {
  return localStorage.getItem("forum_token") || "";
}

async function req(baseUrl: string, path: string, method = "GET", body?: object) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": getToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (typeof data === "string") return JSON.parse(data);
    return data;
  } catch {
    return { error: text };
  }
}

export const api = {
  // AUTH
  register: (username: string, email: string, password: string) =>
    req(AUTH_URL, "/register", "POST", { username, email, password }),
  login: (login: string, password: string) =>
    req(AUTH_URL, "/login", "POST", { login, password }),
  logout: () => req(AUTH_URL, "/logout", "POST"),
  me: () => req(AUTH_URL, "/me", "GET"),
  online: () => req(AUTH_URL, "/online", "GET"),
  updateProfile: (bio: string) => req(AUTH_URL, "/profile", "PUT", { bio }),

  // POSTS
  getPosts: (params?: { category?: string; search?: string; sort?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req(POSTS_URL, `/posts${q ? "?" + q : ""}`, "GET");
  },
  createPost: (title: string, body: string, category: string, tag: string) =>
    req(POSTS_URL, "/posts", "POST", { title, body, category, tag }),
  likePost: (postId: number) => req(POSTS_URL, `/posts/${postId}/like`, "POST"),
  getComments: (postId: number) => req(POSTS_URL, `/posts/${postId}/comments`, "GET"),
  addComment: (postId: number, body: string) =>
    req(POSTS_URL, `/posts/${postId}/comments`, "POST", { body }),
  reportPost: (postId: number, reason: string) =>
    req(POSTS_URL, `/posts/${postId}/report`, "POST", { reason }),
  getReports: () => req(POSTS_URL, "/reports", "GET"),
  moderate: (report_id: number, action: string) =>
    req(POSTS_URL, "/moderate", "POST", { report_id, action }),

  // CHAT
  getDialogs: () => req(CHAT_URL, "/dialogs", "GET"),
  getMessages: (userId: number) => req(CHAT_URL, `/messages/${userId}`, "GET"),
  sendMessage: (receiver_id: number, body: string) =>
    req(CHAT_URL, "/send", "POST", { receiver_id, body }),
  searchUsers: (q: string) => req(CHAT_URL, `/users?q=${encodeURIComponent(q)}`, "GET"),
};
