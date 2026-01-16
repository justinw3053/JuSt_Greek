#!/usr/bin/env python3
from datetime import datetime, timedelta

def generate_ics(start_hour=9):
    """Generate a 30-day ICS calendar."""
    header = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//JuSt_Greek//Study Schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]
    
    footer = ["END:VCALENDAR"]
    events = []
    
    today = datetime.now().replace(hour=start_hour, minute=0, second=0, microsecond=0)
    
    for i in range(30):
        # Skip Sundays if desired, currently everyday
        day = today + timedelta(days=i)
        end_time = day + timedelta(hours=1)
        
        # Format: YYYYMMDDTHHMMSS
        dtstart = day.strftime("%Y%m%dT%H%M%S")
        dtend = end_time.strftime("%Y%m%dT%H%M%S")
        
        event = [
            "BEGIN:VEVENT",
            f"UID:greek-study-{dtstart}@justgreek.local",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            "SUMMARY:🇬🇷 Greek Study Session",
            "DESCRIPTION:1. Prime (5m)\\n2. Input (20m)\\n3. Lab (15m)\\n4. Output (15m)",
            "STATUS:CONFIRMED",
            "END:VEVENT"
        ]
        events.extend(event)
        
    content = "\n".join(header + events + footer)
    
    with open("greek_schedule.ics", "w") as f:
        f.write(content)
    
    print("Generated 'greek_schedule.ics'. Import this into Google Calendar.")

if __name__ == "__main__":
    import sys
    hour = 9
    if len(sys.argv) > 1:
        try:
            hour = int(sys.argv[1])
        except:
            pass
    generate_ics(hour)
