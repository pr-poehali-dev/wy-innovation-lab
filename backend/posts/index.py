"""Посты: список, создание, лайк, комментарии, жалобы"""
import json
import os
import psycopg2
from datetime import datetime

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(conn, token: str):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.username, u.avatar_color
        FROM forum_sessions s
        JOIN forum_users u ON u.id = s.user_id
        WHERE s.token = %s AND s.last_seen > NOW() - INTERVAL '30 days'
    """, (token,))
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'avatar_color': row[2]}

def format_time(dt):
    if not dt:
        return ''
    now = datetime.utcnow()
    diff = now - dt.replace(tzinfo=None)
    s = int(diff.total_seconds())
    if s < 60: return 'только что'
    if s < 3600: return f'{s // 60} мин назад'
    if s < 86400: return f'{s // 3600} ч назад'
    return f'{s // 86400} д назад'

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    token = event.get('headers', {}).get('X-Auth-Token', '')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_conn()
    try:
        user = get_user_by_token(conn, token)

        # LIST POSTS
        if path.endswith('/posts') and method == 'GET':
            category = params.get('category', '')
            search = params.get('search', '')
            sort = params.get('sort', 'new')
            cur = conn.cursor()
            q = """
                SELECT p.id, p.title, p.body, p.category, p.tag, p.likes_count, p.comments_count, p.created_at,
                       u.username, u.avatar_color,
                       CASE WHEN l.id IS NOT NULL THEN true ELSE false END as liked
                FROM forum_posts p
                JOIN forum_users u ON u.id = p.author_id
                LEFT JOIN forum_likes l ON l.post_id = p.id AND l.user_id = %s
                WHERE 1=1
            """
            args = [user['id'] if user else 0]
            if category:
                q += " AND p.category = %s"
                args.append(category)
            if search:
                q += " AND (p.title ILIKE %s OR p.body ILIKE %s)"
                args += [f'%{search}%', f'%{search}%']
            if sort == 'top':
                q += " ORDER BY p.likes_count DESC"
            else:
                q += " ORDER BY p.created_at DESC"
            q += " LIMIT 50"
            cur.execute(q, args)
            rows = cur.fetchall()
            cur.close()
            posts = []
            for r in rows:
                posts.append({
                    'id': r[0], 'title': r[1], 'body': r[2], 'category': r[3], 'tag': r[4],
                    'likes': r[5], 'comments': r[6], 'time': format_time(r[7]),
                    'author': r[8], 'avatar_color': r[9], 'liked': r[10]
                })
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'posts': posts})}

        # CREATE POST
        if path.endswith('/posts') and method == 'POST':
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            title = (body.get('title') or '').strip()
            body_text = (body.get('body') or '').strip()
            category = body.get('category', 'Общее')
            tag = body.get('tag', 'Обсуждение')
            if not title or not body_text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните заголовок и текст'})}
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO forum_posts (author_id, title, body, category, tag) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (user['id'], title, body_text, category, tag)
            )
            post_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': post_id, 'ok': True})}

        # LIKE POST
        if '/like' in path and method == 'POST':
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            post_id = int(path.split('/')[-2])
            cur = conn.cursor()
            cur.execute("SELECT id FROM forum_likes WHERE user_id=%s AND post_id=%s", (user['id'], post_id))
            existing = cur.fetchone()
            if existing:
                cur.execute("UPDATE forum_posts SET likes_count = likes_count - 1 WHERE id=%s", (post_id,))
                cur.execute("UPDATE forum_users SET karma = karma - 1 WHERE id = (SELECT author_id FROM forum_posts WHERE id=%s)", (post_id,))
                cur.execute("DELETE FROM forum_likes WHERE user_id=%s AND post_id=%s", (user['id'], post_id))
                liked = False
            else:
                cur.execute("UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id=%s", (post_id,))
                cur.execute("UPDATE forum_users SET karma = karma + 1 WHERE id = (SELECT author_id FROM forum_posts WHERE id=%s)", (post_id,))
                cur.execute("INSERT INTO forum_likes (user_id, post_id) VALUES (%s, %s)", (user['id'], post_id))
                liked = True
            cur.execute("SELECT likes_count FROM forum_posts WHERE id=%s", (post_id,))
            count = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'liked': liked, 'likes': count})}

        # GET COMMENTS
        if '/comments' in path and method == 'GET':
            post_id = int(path.split('/')[-2])
            cur = conn.cursor()
            cur.execute("""
                SELECT c.id, c.body, c.created_at, u.username, u.avatar_color
                FROM forum_comments c
                JOIN forum_users u ON u.id = c.author_id
                WHERE c.post_id = %s ORDER BY c.created_at ASC
            """, (post_id,))
            rows = cur.fetchall()
            cur.close()
            comments = [{'id': r[0], 'body': r[1], 'time': format_time(r[2]), 'author': r[3], 'avatar_color': r[4]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'comments': comments})}

        # ADD COMMENT
        if '/comments' in path and method == 'POST':
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            post_id = int(path.split('/')[-2])
            text = (body.get('body') or '').strip()
            if not text:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пустой комментарий'})}
            cur = conn.cursor()
            cur.execute("INSERT INTO forum_comments (post_id, author_id, body) VALUES (%s, %s, %s) RETURNING id", (post_id, user['id'], text))
            comment_id = cur.fetchone()[0]
            cur.execute("UPDATE forum_posts SET comments_count = comments_count + 1 WHERE id=%s", (post_id,))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': comment_id, 'ok': True})}

        # REPORT POST
        if '/report' in path and method == 'POST':
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            post_id = int(path.split('/')[-2])
            reason = body.get('reason', 'Другое')
            cur = conn.cursor()
            cur.execute("INSERT INTO forum_reports (reporter_id, post_id, reason) VALUES (%s, %s, %s)", (user['id'], post_id, reason))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # LIST REPORTS (moderation)
        if path.endswith('/reports') and method == 'GET':
            cur = conn.cursor()
            cur.execute("""
                SELECT r.id, p.title, u.username, r.reason, r.status, COUNT(r2.id) as cnt
                FROM forum_reports r
                JOIN forum_posts p ON p.id = r.post_id
                JOIN forum_users u ON u.id = p.author_id
                LEFT JOIN forum_reports r2 ON r2.post_id = r.post_id
                GROUP BY r.id, p.title, u.username, r.reason, r.status
                ORDER BY cnt DESC LIMIT 50
            """)
            rows = cur.fetchall()
            cur.close()
            reports = [{'id': r[0], 'post': r[1], 'author': r[2], 'reason': r[3], 'status': r[4], 'reports': r[5]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'reports': reports})}

        # MODERATION ACTION
        if path.endswith('/moderate') and method == 'POST':
            report_id = body.get('report_id')
            action = body.get('action')
            cur = conn.cursor()
            cur.execute("UPDATE forum_reports SET status=%s WHERE id=%s", (action, report_id))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
