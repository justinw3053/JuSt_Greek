#!/usr/bin/env python3
import argparse
import os
import json
from datetime import datetime
from pathlib import Path
from tabulate import tabulate

BASE_DIR = Path(__file__).parent.parent
CURRICULUM_DIR = BASE_DIR / "01_Curriculum"
ADMIN_DIR = BASE_DIR / "00_Admin"
LOG_FILE = ADMIN_DIR / "study_log.json"

def init_env():
    """Initialize the environment if not already present."""
    # Ensure directories exist
    dirs = [
        CURRICULUM_DIR,
        ADMIN_DIR,
        BASE_DIR / "02_Library" / "A1",
        BASE_DIR / "02_Library" / "B1-B2",
        BASE_DIR / "02_Library" / "C1",
        BASE_DIR / "03_Voice_Lab" / "input",
        BASE_DIR / "03_Voice_Lab" / "output",
        BASE_DIR / "03_Voice_Lab" / "user_practice",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        print(f"[OK] {d}")

    if not LOG_FILE.exists():
        with open(LOG_FILE, 'w') as f:
            json.dump([], f)
        print(f"[OK] Created log file: {LOG_FILE}")

def log_session(hours, activity, notes=""):
    """Log a study session."""
    if not LOG_FILE.exists():
        init_env()
    
    entry = {
        "date": datetime.now().isoformat(),
        "hours": float(hours),
        "activity": activity,
        "notes": notes
    }
    
    with open(LOG_FILE, 'r') as f:
        logs = json.load(f)
    
    logs.append(entry)
    
    with open(LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)
    
    print(f"Logged {hours} hours of '{activity}'.")

def show_status():
    """Show study statistics."""
    if not LOG_FILE.exists():
        print("No logs found. Run 'init' first.")
        return

    with open(LOG_FILE, 'r') as f:
        logs = json.load(f)

    if not logs:
        print("No study sessions logged yet.")
        return

    total_hours = sum(log['hours'] for log in logs)
    print(f"\nTotal Study Hours: {total_hours:.2f}")
    
    # Recent sessions
    print("\nRecent Sessions:")
    table = []
    for log in logs[-5:]:
        table.append([log['date'][:10], log['hours'], log['activity'], log['notes']])
    
    print(tabulate(table, headers=["Date", "Hours", "Activity", "Notes"]))

def main():
    parser = argparse.ArgumentParser(description="JuSt_Greek Manager")
    subparsers = parser.add_subparsers(dest="command")

    # init
    subparsers.add_parser("init", help="Initialize the directory structure")

    # log
    log_parser = subparsers.add_parser("log", help="Log a study session")
    log_parser.add_argument("hours", type=float, help="Hours spent")
    log_parser.add_argument("activity", type=str, help="Activity (e.g., Reading, Listening)")
    log_parser.add_argument("--topic", type=str, default="General", help="Current Topic (e.g., 'Week 1.2')")
    log_parser.add_argument("--notes", type=str, default="", help="Optional notes")

    # report
    subparsers.add_parser("report", help="Generate status report for NotebookLM")

    # check
    parser.add_argument("--check", action="store_true", help="Check if studied today (silent check)")

    # streak
    parser.add_argument("--streak", action="store_true", help="Show current streak")

    args = parser.parse_args()

    if args.command == "init":
        init_env()
    elif args.command == "log":
        log_session(args.hours, args.activity, args.topic, args.notes)
    elif args.command == "status":
        show_status()
    elif args.command == "report":
        generate_report()
    elif args.check:
        check_daily_status()
    elif args.streak:
        calculate_streak()
    else:
        # If no subcommand but flags present, handle them
        if args.check:
            check_daily_status()
        elif args.streak:
            calculate_streak()
        else:
            parser.print_help()

def check_daily_status():
    """Check if a session has been logged today."""
    if not LOG_FILE.exists():
        return
    
    today = datetime.now().strftime("%Y-%m-%d")
    with open(LOG_FILE, 'r') as f:
        logs = json.load(f)
        
    has_studied = any(log['date'].startswith(today) for log in logs)
    
    if has_studied:
        print("✅ You have studied today. Good job!")
        exit(0)
    else:
        print("⚠️  You have NOT studied yet today.")
        print("   Run: ./manager.py log [hours] [activity]")
        exit(1)

def calculate_streak():
    """Calculate current day streak."""
    if not LOG_FILE.exists():
        print("Streak: 0 days")
        return

    with open(LOG_FILE, 'r') as f:
        logs = json.load(f)
    
    if not logs:
        print("Streak: 0 days")
        return

    # Extract unique dates
    dates = sorted(list(set(log['date'][:10] for log in logs)), reverse=True)
    
    if not dates:
        print("Streak: 0 days")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now().date().toordinal() - 1)
    
    # Check if streak starts today or yesterday
    streak = 0
    current_check = datetime.now().date()
    
    # If not studied today yet, check if studied yesterday to keep streak alive
    if dates[0] == today:
        streak = 1
        current_check = current_check.replace(day=current_check.day - 1) # Check yesterday next
        dates.pop(0)
    elif dates[0] != str(datetime.fromordinal(yesterday)):
        # Streak broken
        print(f"Streak: 0 days (Last breakdown: {dates[0]})")
        return

    # Count backwards
    # This is a simple streak calc, could be improved with libraries but trying to keep deps low
    print(f"Current Streak: {len(dates) + streak if streak else 0} days") # Simplified for now


if __name__ == "__main__":
    main()
