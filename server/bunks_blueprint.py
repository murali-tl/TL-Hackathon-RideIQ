"""
Community bunks API — register on your Flask app:

    from bunks_blueprint import bunks_bp, init_bunks_db
    init_bunks_db()  # once at startup (seeds SQLite if empty)
    app.register_blueprint(bunks_bp)

Expected routes (prefix /api/bunks):
  GET    /api/bunks
  POST   /api/bunks           JSON { name, location, stars, initialComment? }
  GET    /api/bunks/comments  all comments { id, bunkId, text, createdAt }
  POST   /api/bunks/<id>/comments JSON { text }
  POST   /api/bunks/<id>/rate JSON { stars }
  DELETE /api/bunks/<id>

Response envelope: { "success": true, "data": ... }
Requires: pip install flask
"""
from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, jsonify, request

DB_PATH = Path(__file__).resolve().parent / "bunks.sqlite3"

SEED_ROWS: list[tuple] = [
    ("b1", 1, "HP Petrol Pump", "Madhapur, near Cyber Towers", 5.0, "4.9/5", "+3.2 km/L", 247, "accent"),
    ("b2", 2, "Indian Oil — Kondapur", "Kondapur Main Road, near DLF", 4.0, "4.4/5", "+1.8 km/L", 182, "muted"),
    ("b3", 3, "BPCL Speed — Gachibowli", "Gachibowli flyover, near Inorbit Mall", 4.0, "4.1/5", "+1.1 km/L", 98, "outline"),
]

bunks_bp = Blueprint("bunks", __name__, url_prefix="/api/bunks")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clamp_comment(text: str) -> str:
    t = text.strip()
    return t[:2000] if len(t) > 2000 else t


def init_bunks_db(db_path: Path | None = None) -> None:
    global DB_PATH
    if db_path is not None:
        DB_PATH = db_path
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = _connect()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS bunks (
              id TEXT PRIMARY KEY,
              rank INTEGER NOT NULL,
              name TEXT NOT NULL,
              location TEXT NOT NULL,
              stars REAL NOT NULL,
              trust TEXT NOT NULL,
              boost TEXT NOT NULL,
              reviews INTEGER NOT NULL,
              accent_rank TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS bunk_comments (
              id TEXT PRIMARY KEY,
              bunk_id TEXT NOT NULL,
              text TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY (bunk_id) REFERENCES bunks(id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()
        cur = conn.execute("SELECT COUNT(*) FROM bunks")
        if cur.fetchone()[0] == 0:
            for row in SEED_ROWS:
                conn.execute(
                    "INSERT INTO bunks (id, rank, name, location, stars, trust, boost, reviews, accent_rank) VALUES (?,?,?,?,?,?,?,?,?)",
                    row,
                )
            conn.commit()
    finally:
        conn.close()


def _row_to_json(r: sqlite3.Row) -> dict:
    return {
        "id": r["id"],
        "rank": r["rank"],
        "name": r["name"],
        "location": r["location"],
        "stars": float(r["stars"]),
        "trust": r["trust"],
        "boost": r["boost"],
        "reviews": int(r["reviews"]),
        "accentRank": r["accent_rank"],
    }


def _envelope(data):
    return jsonify({"success": True, "data": data})


def _comment_to_json(r: sqlite3.Row) -> dict:
    return {
        "id": r["id"],
        "bunkId": r["bunk_id"],
        "text": r["text"],
        "createdAt": r["created_at"],
    }


SEED_IDS = frozenset(r[0] for r in SEED_ROWS)


@bunks_bp.route("", methods=["GET", "OPTIONS"])
def list_bunks():
    if request.method == "OPTIONS":
        return ("", 204)
    conn = _connect()
    try:
        rows = conn.execute("SELECT * FROM bunks ORDER BY rank ASC").fetchall()
        return _envelope([_row_to_json(r) for r in rows])
    finally:
        conn.close()


@bunks_bp.route("", methods=["POST"])
def create_bunk():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    location = str(body.get("location", "")).strip()
    stars = body.get("stars", 4)
    try:
        stars_f = float(stars)
    except (TypeError, ValueError):
        stars_f = 4.0
    stars_f = max(1.0, min(5.0, stars_f))
    if not name or not location:
        return jsonify({"success": False, "message": "name and location required"}), 400

    initial = _clamp_comment(str(body.get("initialComment", "") or ""))

    conn = _connect()
    try:
        cur = conn.execute("SELECT COALESCE(MAX(rank), 0) FROM bunks")
        next_rank = int(cur.fetchone()[0]) + 1
        bid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO bunks (id, rank, name, location, stars, trust, boost, reviews, accent_rank) VALUES (?,?,?,?,?,?,?,?,?)",
            (bid, next_rank, name, location, stars_f, "—", "—", 1, "outline"),
        )
        if initial:
            cid = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO bunk_comments (id, bunk_id, text, created_at) VALUES (?,?,?,?)",
                (cid, bid, initial, _iso_now()),
            )
        conn.commit()
        row = conn.execute("SELECT * FROM bunks WHERE id = ?", (bid,)).fetchone()
        return _envelope(_row_to_json(row)), 201
    finally:
        conn.close()


@bunks_bp.route("/comments", methods=["GET", "OPTIONS"])
def list_all_comments():
    if request.method == "OPTIONS":
        return ("", 204)
    conn = _connect()
    try:
        rows = conn.execute(
            "SELECT id, bunk_id, text, created_at FROM bunk_comments ORDER BY created_at DESC",
        ).fetchall()
        return _envelope([_comment_to_json(r) for r in rows])
    finally:
        conn.close()


@bunks_bp.route("/<bid>/comments", methods=["POST", "OPTIONS"])
def add_bunk_comment(bid: str):
    if request.method == "OPTIONS":
        return ("", 204)
    body = request.get_json(silent=True) or {}
    text = _clamp_comment(str(body.get("text", "") or ""))
    if not text:
        return jsonify({"success": False, "message": "text required"}), 400

    conn = _connect()
    try:
        row = conn.execute("SELECT id FROM bunks WHERE id = ?", (bid,)).fetchone()
        if not row:
            return jsonify({"success": False, "message": "bunk not found"}), 404
        cid = str(uuid.uuid4())
        now = _iso_now()
        conn.execute(
            "INSERT INTO bunk_comments (id, bunk_id, text, created_at) VALUES (?,?,?,?)",
            (cid, bid, text, now),
        )
        conn.commit()
        r = conn.execute(
            "SELECT id, bunk_id, text, created_at FROM bunk_comments WHERE id = ?",
            (cid,),
        ).fetchone()
        return _envelope(_comment_to_json(r)), 201
    finally:
        conn.close()


@bunks_bp.route("/<bid>/rate", methods=["POST", "OPTIONS"])
def rate_bunk(bid: str):
    if request.method == "OPTIONS":
        return ("", 204)
    body = request.get_json(silent=True) or {}
    try:
        new_s = float(body.get("stars", 0))
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "stars required"}), 400
    new_s = max(1.0, min(5.0, new_s))

    conn = _connect()
    try:
        row = conn.execute("SELECT * FROM bunks WHERE id = ?", (bid,)).fetchone()
        if not row:
            return jsonify({"success": False, "message": "not found"}), 404
        old_stars = float(row["stars"])
        old_n = int(row["reviews"])
        avg = (old_stars * old_n + new_s) / (old_n + 1)
        conn.execute(
            "UPDATE bunks SET stars = ?, reviews = ? WHERE id = ?",
            (round(avg, 2), old_n + 1, bid),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM bunks WHERE id = ?", (bid,)).fetchone()
        return _envelope(_row_to_json(row))
    finally:
        conn.close()


@bunks_bp.route("/<bid>", methods=["DELETE", "OPTIONS"])
def delete_bunk(bid: str):
    if request.method == "OPTIONS":
        return ("", 204)
    if bid in SEED_IDS:
        return jsonify({"success": False, "message": "cannot delete seed bunk"}), 403
    conn = _connect()
    try:
        conn.execute("DELETE FROM bunk_comments WHERE bunk_id = ?", (bid,))
        cur = conn.execute("DELETE FROM bunks WHERE id = ?", (bid,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "not found"}), 404
        return ("", 204)
    finally:
        conn.close()


@bunks_bp.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Accept"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
    return resp


def create_dev_app():
    """Minimal app for manual testing: python server/bunks_blueprint.py (from repo root)."""
    from flask import Flask

    init_bunks_db()
    app = Flask(__name__)
    app.register_blueprint(bunks_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"ok": True})

    return app


if __name__ == "__main__":
    create_dev_app().run(host="127.0.0.1", port=5001, debug=True)
