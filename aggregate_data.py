import json
from datetime import datetime
from fetch_stationboard import fetch_stationboard

STATIONS = [
    "Zürich HB",
    "Genève",
    "Bern",
    "Basel SBB",
    "Lausanne",
    "Luzern",
]     

def compute_delay_minutes(stop):
    #returns delay in mins bw scheduled and live estimate
    scheduled = stop.get("departure")
    live = stop.get("prognosis", {}).get("departure")
    if not scheduled or not live: 
        return None

    fmt = "%Y-%m-%dT%H:%M:%S%z"
    scheduled_dt = datetime.strptime(scheduled, fmt)
    live_dt = datetime.strptime(live, fmt)
    return round((live_dt - scheduled_dt).total_seconds() / 60,1)

def build_station_summary(station_name):
    data = fetch_stationboard(station_name,limit =15)
    departures = data.get("stationboard", [])

    delays = []
    lines = set()
    for d in departures:
        stop = d.get("stop", {})
        delay = compute_delay_minutes(stop)
        if delay is not None:
            delays.append(delay)
        lines.add(d.get("category","?"))

    avg_delay = round(sum(delays) / len(delays), 1) if delays else 0

    return{     
        "station": station_name,
        "train_count": len(departures),
        "avg_delay_minutes": avg_delay,
        "lines": sorted(lines),
    }

def build_all():
    return [build_station_summary(s) for s in STATIONS]

if __name__ == "__main__":
    summary = build_all()         
    with open("data.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Wrote data.json with {len(summary)} stations:")
    for s in summary:
        print(f"- {s['station']}: {s['train_count']} trains, avg delay {s['avg_delay_minutes']} min")