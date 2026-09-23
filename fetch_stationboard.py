import requests

BASE_URL = "http://transport.opendata.ch/v1/stationboard"

def fetch_stationboard(station_name, limit=10):
    #fetching upcoming departures for a station including delay time

    params = {"station": station_name, "limit": limit}
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status() 

    return response.json()

if __name__ == "__main__":
    data = fetch_stationboard("Zürich HB")
    departures = data.get("stationboard", [])
    print(f"Fetched {len(departures)} departures for Zürich HB:")
    for d in departures[:5]:
        name = d["category"] + d["number"]
        to = d["to"]
        prognosis = d.get("stop", {}).get("prognosis", {})
        delay = prognosis.get("departure")
        print(f"- {name} → {to} | live estimate: {delay}")