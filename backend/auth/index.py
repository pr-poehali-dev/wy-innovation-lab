"""Авторизация: регистрация, вход, выход, профиль пользователя"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.username, u.email, u.avatar_color, u.bio, u.karma, u.created_at
        FROM forum_sessions s
        JOIN forum_users u ON u.id = s.user_id
        WHERE s.token = %s AND s.last_seen > NOW() - INTERVAL '30 days'
    """, (token,))
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'email': row[2], 'avatar_color': row[3], 'bio': row[4], 'karma': row[5]}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    token = event.get('headers', {}).get('X-Auth-Token', '')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_conn()
    try:
        # REGISTER
        if path.endswith('/register') and method == 'POST':
            username = (body.get('username') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''

            if not username or not email or not password:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(username) < 3:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Имя минимум 3 символа'})}
            if len(password) < 6:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

            colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#F7A072', '#98D8C8']
            color = colors[ord(username[0]) % len(colors)]

            cur = conn.cursor()
            try:
                cur.execute(
                    "INSERT INTO forum_users (username, email, password_hash, avatar_color) VALUES (%s, %s, %s, %s) RETURNING id",
                    (username, email, hash_password(password), color)
                )
                user_id = cur.fetchone()[0]
                conn.commit()
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                cur.close()
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Имя или email уже заняты'})}

            token_val = secrets.token_hex(32)
            cur.execute("INSERT INTO forum_sessions (user_id, token) VALUES (%s, %s)", (user_id, token_val))
            conn.commit()
            cur.close()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': token_val,
                'user': {'id': user_id, 'username': username, 'email': email, 'avatar_color': color, 'bio': '', 'karma': 0}
            })}

        # LOGIN
        if path.endswith('/login') and method == 'POST':
            login = (body.get('login') or '').strip().lower()
            password = body.get('password') or ''

            cur = conn.cursor()
            cur.execute(
                "SELECT id, username, email, avatar_color, bio, karma FROM forum_users WHERE (LOWER(email)=%s OR LOWER(username)=%s) AND password_hash=%s",
                (login, login, hash_password(password))
            )
            row = cur.fetchone()
            cur.close()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            user_id, username, email, color, bio, karma = row
            token_val = secrets.token_hex(32)
            cur = conn.cursor()
            cur.execute("INSERT INTO forum_sessions (user_id, token) VALUES (%s, %s)", (user_id, token_val))
            conn.commit()
            cur.close()

            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'token': token_val,
                'user': {'id': user_id, 'username': username, 'email': email, 'avatar_color': color, 'bio': bio or '', 'karma': karma}
            })}

        # LOGOUT
        if path.endswith('/logout') and method == 'POST':
            if token:
                cur = conn.cursor()
                cur.execute("UPDATE forum_sessions SET last_seen = '2000-01-01' WHERE token = %s", (token,))
                conn.commit()
                cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # ME
        if path.endswith('/me') and method == 'GET':
            user = get_user_by_token(conn, token)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            # update last_seen & count posts/comments
            cur = conn.cursor()
            cur.execute("UPDATE forum_sessions SET last_seen = NOW() WHERE token = %s", (token,))
            cur.execute("SELECT COUNT(*) FROM forum_posts WHERE author_id = %s", (user['id'],))
            posts_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM forum_comments WHERE author_id = %s", (user['id'],))
            comments_count = cur.fetchone()[0]
            conn.commit()
            cur.close()
            user['posts_count'] = posts_count
            user['comments_count'] = comments_count
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        # UPDATE PROFILE
        if path.endswith('/profile') and method == 'PUT':
            user = get_user_by_token(conn, token)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            bio = body.get('bio', user.get('bio', ''))
            cur = conn.cursor()
            cur.execute("UPDATE forum_users SET bio = %s WHERE id = %s", (bio, user['id']))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # ONLINE COUNT
        if path.endswith('/online') and method == 'GET':
            if token:
                cur = conn.cursor()
                cur.execute("UPDATE forum_sessions SET last_seen = NOW() WHERE token = %s", (token,))
                conn.commit()
                cur.close()
            cur = conn.cursor()
            cur.execute("SELECT COUNT(DISTINCT user_id) FROM forum_sessions WHERE last_seen > NOW() - INTERVAL '5 minutes'")
            count = cur.fetchone()[0]
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'online': count})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
