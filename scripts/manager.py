#!/usr/bin/env python3
import argparse
import json
from datetime import datetime, date
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator
from tabulate import tabulate

BASE_DIR = Path(__file__).parent.parent
CURRICULUM_DIR = BASE_DIR / "01_Curriculum"
ADMIN_DIR = BASE_DIR / "00_Admin"
LOG_FILE = ADMIN_DIR / "study_log.json"


class StudySession(BaseModel):
    date: datetime = Field(default_factory=datetime.now)
    hours: float = Field(..., gt=0, description="Hours spent studying")
    activity: str = Field(..., min_length=2)
    topic: str = "General"
    notes: Optional[str] = ""

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: float) -> float:
        return round(v, 2)

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class StudyLog(BaseModel):
    sessions: List[StudySession] = []

    def add_session(self, session: StudySession):
        self.sessions.append(session)
        self.save()

    def save(self):
        # We save as a list for backward compatibility with the existing JSON structure
        data = [s.model_dump(mode='json') for s in self.sessions]
        with open(LOG_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls) -> "StudyLog":
        if not LOG_FILE.exists():
            return cls()
        
        try:
            with open(LOG_FILE, 'r') as f:
                data = json.load(f)
            # Handle potential list vs dict structure if schema changes in future
            if isinstance(data, list):
                sessions = [StudySession(**item) for item in data]
                return cls(sessions=sessions)
            return cls()
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error loading logs: {e}")
            return cls()

    @property
    def total_hours(self) -> float:
        return sum(s.hours for s in self.sessions)
    
    @property
    def current_streak(self) -> int:
        if not self.sessions:
            return 0
            
        dates = sorted({s.date.date() for s in self.sessions}, reverse=True)
        if not dates:
            return 0
            
        today = date.today()
        # If last study was not today or yesterday, streak is broken
        if dates[0] != today and dates[0] != date.fromordinal(today.toordinal() - 1):
            return 0
            
        streak = 0
        current = today
        
        # Check if we studied today to start counting
        if dates[0] == today:
            streak = 1
            current = date.fromordinal(current.toordinal() - 1)
        elif dates[0] == date.fromordinal(today.toordinal() - 1):
             # Logic handled below, just setup loop
             pass
             
        # Simple consecutive check
        check_dates = set(dates)
        # Re-calc precisely
        streak = 0
        # Start from today or yesterday
        test_date = today
        if test_date not in check_dates:
             test_date = date.fromordinal(test_date.toordinal() - 1)
             
        while test_date in check_dates:
            streak += 1
            test_date = date.fromordinal(test_date.toordinal() - 1)
            
        return streak


def init_env():
    """Initialize the environment if not already present."""
    dirs = [
        CURRICULUM_DIR,
        ADMIN_DIR,
        BASE_DIR / "02_Library" / "A1",
        BASE_DIR / "02_Library" / "B1-B2",
        BASE_DIR / "02_Library" / "C1",
        BASE_DIR / "03_Voice_Lab" / "input",
        BASE_DIR / "03_Voice_Lab" / "output",
        BASE_DIR / "03_Voice_Lab" / "user_practice",
        BASE_DIR / "web_app" / "public" / "audio"
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        print(f"[OK] {d}")

    if not LOG_FILE.exists():
        StudyLog().save()
        print(f"[OK] Created log file: {LOG_FILE}")


def show_status():
    log = StudyLog.load()
    if not log.sessions:
        print("No study sessions logged yet.")
        return

    print(f"\nTotal Study Hours: {log.total_hours:.2f}")
    print(f"Current Streak: {log.current_streak} days")
    
    print("\nRecent Sessions:")
    table = []
    # Sort by date descending
    sorted_sessions = sorted(log.sessions, key=lambda s: s.date, reverse=True)
    
    for s in sorted_sessions[:5]:
        table.append([
            s.date.strftime("%Y-%m-%d"), 
            s.hours, 
            s.activity, 
            s.topic,
            s.notes
        ])
    
    print(tabulate(table, headers=["Date", "Hours", "Activity", "Topic", "Notes"]))


def main():
    parser = argparse.ArgumentParser(description="JuSt_Greek Manager")
    subparsers = parser.add_subparsers(dest="command")

    # init
    subparsers.add_parser("init", help="Initialize the directory structure")

    # log
    log_parser = subparsers.add_parser("log", help="Log a study session")
    log_parser.add_argument("hours", type=float, help="Hours spent")
    log_parser.add_argument("activity", type=str, help="Activity (e.g., Reading, Listening)")
    log_parser.add_argument("--topic", type=str, default="General", help="Current Topic")
    log_parser.add_argument("--notes", type=str, default="", help="Optional notes")

    # status
    subparsers.add_parser("status", help="Show study statistics")

    # check
    parser.add_argument("--check", action="store_true", help="Check if studied today")

    args = parser.parse_args()

    if args.command == "init":
        init_env()
    elif args.command == "log":
        log = StudyLog.load()
        session = StudySession(
            hours=args.hours,
            activity=args.activity,
            topic=args.topic,
            notes=args.notes
        )
        log.add_session(session)
        print(f"Logged {session.hours} hours of '{session.activity}'.")
    elif args.command == "status":
        show_status()
    elif args.check:
        log = StudyLog.load()
        today_str = date.today().isoformat()
        has_studied = any(s.date.date() == date.today() for s in log.sessions)
        
        if has_studied:
            print("✅ You have studied today. Good job!")
            exit(0)
        else:
            print("⚠️  You have NOT studied yet today.")
            exit(1)
    else:
        if not args.command:
            parser.print_help()

if __name__ == "__main__":
    main()
