import json
import sys
from datetime import datetime,timezone
from fetch_stationboard import fetch_stationboard

STATIONS = [
    "Zürich HB",
    "Genève",
    "Bern",
    "Basel SBB",
    "Lausanne",
    "Luzern",
]     

TIME_FMT = "%Y-%m-%dT%H:%M:%S%z"
WINDOW_MINUTES = 30

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


def is_within_window(departure_str,now,minutes = WINDOW_MINUTES):
    #true if the departure happens within the next min
    if not departure_str:
        return False

    departure = datetime.strptime(departure_str,TIME_FMT)
    diff = (departure - now).total_seconds()/60
    return diff <= minutes



def build_station_summary(station_name):
    data = fetch_stationboard(station_name,limit =40)
    departures = data.get("stationboard", [])
    now = datetime.now(timezone.utc)

    delays = []
    lines = set()
    soon_count = 0
    for d in departures:
        stop = d.get("stop", {})
        if is_within_window(stop.get("departure"),now):
            soon_count = soon_count +1

        delay = compute_delay_minutes(stop)
        if delay is not None:
            delays.append(delay)
        lines.add(d.get("category","?"))

    avg_delay = round(sum(delays) / len(delays), 1) if delays else 0

    return{     
        "station": station_name,
        "train_count": soon_count,
         "avg_delay_minutes": avg_delay,
         "lines": sorted(lines),
    }

def build_all():
    results = []
    for name in STATIONS:
        try:
            results.append(build_station_summary(name))

        except Exception as err:
            print("warning:skipped"+name + str(err))

    return results

if __name__ == "__main__":
    summary = build_all()
    if not summary:
        print("error : no stations fetched, keeping old data.json as it is ")
        sys.exit(1)
    with open("data.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("Wrote data.json with " + str(len(summary)) + " stations:")
    for s in summary:
        print("- " + s["station"] + ": " + str(s["train_count"]) + " trains in next " + str(WINDOW_MINUTES) + " min, avg delay " + str(s["avg_delay_minutes"]) + " min")