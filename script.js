// ===== CONFIG — fill these in =====
const CALENDAR_ID = "your_calendar_id@group.calendar.google.com";
const API_KEY = "YOUR_GOOGLE_API_KEY";
const MAX_EVENTS = 5;
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone; // visitor's time zone
// ==================================

// 1. Embed the calendar iframe
document.getElementById("calendar-frame").src =
  "https://calendar.google.com/calendar/embed" +
  "?src=" + encodeURIComponent(CALENDAR_ID) +
  "&ctz=" + encodeURIComponent(TIME_ZONE);

// 2. Load the next few events
async function loadUpcomingEvents() {
  const list = document.getElementById("event-list");

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin: new Date().toISOString(),
    maxResults: MAX_EVENTS,
    singleEvents: "true", // expand recurring events into individual instances
    orderBy: "startTime",
  });

  const url =
    "https://www.googleapis.com/calendar/v3/calendars/" +
    encodeURIComponent(CALENDAR_ID) +
    "/events?" + params;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText);
    }

    const data = await res.json();
    const events = data.items || [];

    list.innerHTML = "";

    if (events.length === 0) {
      list.innerHTML = '<li class="status">No upcoming events.</li>';
      return;
    }

    events.forEach((event) => list.appendChild(renderEvent(event)));
  } catch (err) {
    list.innerHTML = "";
    const li = document.createElement("li");
    li.className = "status error";
    li.textContent = "Couldn't load events: " + err.message;
    list.appendChild(li);
  }
}

function renderEvent(event) {
  const li = document.createElement("li");

  const title = document.createElement("p");
  title.className = "event-title";
  const link = document.createElement("a");
  link.href = event.htmlLink;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = event.summary || "(No title)";
  title.appendChild(link);

  const time = document.createElement("p");
  time.className = "event-time";
  time.textContent = formatEventTime(event);

  li.append(title, time);

  if (event.location) {
    const loc = document.createElement("p");
    loc.className = "event-location";
    loc.textContent = "📍 " + event.location;
    li.appendChild(loc);
  }

  return li;
}

function formatEventTime(event) {
  // All-day events use start.date ("2026-11-05"); timed events use start.dateTime
  if (event.start.date) {
    const [y, m, d] = event.start.date.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    return day.toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric",
    }) + " · All day";
  }

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  const datePart = start.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
  const timeOpts = { hour: "numeric", minute: "2-digit" };

  return `${datePart} · ${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
}

loadUpcomingEvents();
