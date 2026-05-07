"""Личные сообщения между пользователями"""
import json
import os
import psycopg2
from datetime import datetime

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    if s < 3600: return f'{s // 60} мин'
    if s < 86400: return f'{s // 3600} ч'
    return f'{s // 86400} д'

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
        user = get_user_by_token(conn, token)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

        # LIST DIALOGS
        if path.endswith('/dialogs') and method == 'GET':
            cur = conn.cursor()
            cur.execute("""
                SELECT DISTINCT ON (other_id)
                    other_id, other_username, other_color, last_msg, last_time, unread_count
                FROM (
                    SELECT
                        CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END as other_id,
                        CASE WHEN m.sender_id = %s THEN ru.username ELSE su.username END as other_username,
                        CASE WHEN m.sender_id = %s THEN ru.avatar_color ELSE su.avatar_color END as other_color,
                        m.body as last_msg,
                        m.created_at as last_time,
                        SUM(CASE WHEN m.receiver_id = %s AND m.is_read = false THEN 1 ELSE 0 END) OVER (
                            PARTITION BY CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END
                        ) as unread_count
                    FROM forum_messages m
                    JOIN forum_users su ON su.id = m.sender_id
                    JOIN forum_users ru ON ru.id = m.receiver_id
                    WHERE m.sender_id = %s OR m.receiver_id = %s
                    ORDER BY m.created_at DESC
                ) sub
                ORDER BY other_id, last_time DESC
            """, (user['id'], user['id'], user['id'], user['id'], user['id'], user['id'], user['id']))
            rows = cur.fetchall()
            cur.close()
            dialogs = [{'user_id': r[0], 'username': r[1], 'avatar_color': r[2], 'last_msg': r[3], 'time': format_time(r[4]), 'unread': r[5]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'dialogs': dialogs})}

        # GET MESSAGES WITH USER
        if '/messages/' in path and method == 'GET':
            other_id = int(path.split('/')[-1])
            cur = conn.cursor()
            cur.execute("""
                SELECT m.id, m.body, m.created_at, m.sender_id, u.username, u.avatar_color
                FROM forum_messages m
                JOIN forum_users u ON u.id = m.sender_id
                WHERE (m.sender_id=%s AND m.receiver_id=%s) OR (m.sender_id=%s AND m.receiver_id=%s)
                ORDER BY m.created_at ASC LIMIT 100
            """, (user['id'], other_id, other_id, user['id']))
            rows = cur.fetchall()
            cur.execute("UPDATE forum_messages SET is_read=true WHERE receiver_id=%s AND sender_id=%s", (user['id'], other_id))
            conn.commit()
            cur.close()
            messages = [{'id': r[0], 'body': r[1], 'time': format_time(r[2]), 'sender_id': r[3], 'sender': r[4], 'avatar_color': r[5], 'is_mine': r[3] == user['id']} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': messages})}

        # SEND MESSAGE
        if path.endswith('/send') and method == 'POST':
            receiver_id = body.get('receiver_id')
            text = (body.get('body') or '').strip()
            if not text or not receiver_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите получателя и текст'})}
            cur = conn.cursor()
            cur.execute("INSERT INTO forum_messages (sender_id, receiver_id, body) VALUES (%s, %s, %s) RETURNING id", (user['id'], receiver_id, text))
            msg_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': msg_id, 'ok': True})}

        # SEARCH USERS
        if path.endswith('/users') and method == 'GET':
            params = event.get('queryStringParameters') or {}
            q = params.get('q', '')
            cur = conn.cursor()
            cur.execute("SELECT id, username, avatar_color FROM forum_users WHERE username ILIKE %s AND id != %s LIMIT 10", (f'%{q}%', user['id']))
            rows = cur.fetchall()
            cur.close()
            users = [{'id': r[0], 'username': r[1], 'avatar_color': r[2]} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
