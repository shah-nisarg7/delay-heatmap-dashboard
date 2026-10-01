from http.server import BaseHTTPRequestHandler
import json
from aggregate_data import build_all

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        summary = build_all()
        body = json.dumps(summary).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "s-maxage=60")
        self.end_headers()
        self.wfile.write(body)