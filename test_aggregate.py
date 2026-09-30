from datetime import datetime 
from aggregate_data import compute_delay_minutes, is_within_window, TIME_FMT;

def test_delay_is_none_without_prognosis():
    stop = {"departure": "2026-09-28T14:00:00+200"}
    assert compute_delay_minutes(stop) is None


def test_delay_five_minutes():
    stop = {
        "departure": "2026-09-28T14:00:00+0200",
        "prognosis": {"departure": "2026-09-28T14:05:00+0200"},
    }
    assert compute_delay_minutes(stop) == 5.0


def test_window_logic():
    now = datetime.strptime("2026-09-28T14:00:00+0200",TIME_FMT)
    assert is_within_window("2026-09-28T14:00:00+0200",now) is True
    assert is_within_window("2026-09-28T15:00:00+0200", now) is False
    assert is_within_window(None, now) is False


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("PASS", name)