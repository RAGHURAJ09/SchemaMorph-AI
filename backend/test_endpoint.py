import urllib.request, urllib.parse, json

# 1. Upload Schema
schema = """
CREATE TABLE directors (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL);
CREATE TABLE films (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, director_id INTEGER NOT NULL, FOREIGN KEY (director_id) REFERENCES directors(id));
"""
import mimetypes
boundary = 'wL36Yn8afVp8Ag7AmP8qZ0SA4n1v9T'
body = (
    '--' + boundary + '\r\n'
    'Content-Disposition: form-data; name="schema_text"\r\n\r\n'
    + schema + '\r\n'
    '--' + boundary + '--\r\n'
).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/api/v1/upload-schema', data=body, headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})
with urllib.request.urlopen(req) as res:
    resp = json.loads(res.read().decode())
    session_id = resp['session_id']
    print('UPLOAD OK, session:', session_id)

# 2. Analyze
req2 = urllib.request.Request('http://localhost:8000/api/v1/analyze', data=json.dumps({'session_id': session_id}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req2) as res2:
        print('ANALYZE OK, status:', res2.status)
        print(json.dumps(json.loads(res2.read().decode()), indent=2))
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    print(e.read().decode())
