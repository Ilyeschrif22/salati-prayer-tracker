const API_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5220`;

const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

async function readResponse(response, fallbackMessage) {
  const body = await response.text();
  let data = body;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    // Some ASP.NET error responses are plain text.
  }

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data?.message || fallbackMessage);
  }

  return data;
}

export function formatPrayerDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSavedDayDetails(userId, date) {
  try {
    return JSON.parse(window.localStorage.getItem(
      `salati-calendar-details:${userId}:${formatPrayerDate(date)}`
    )) || {};
  } catch {
    return {};
  }
}

export function saveDayDetails(userId, date, details) {
  window.localStorage.setItem(
    `salati-calendar-details:${userId}:${formatPrayerDate(date)}`,
    JSON.stringify(details)
  );
}

export function toPrayerStatuses(prayers = []) {
  return prayers.reduce((statuses, prayer) => {
    const name = typeof prayer.type === 'number' ? prayerNames[prayer.type] : prayer.type;
    const status = typeof prayer.status === 'string'
      ? prayer.status.toLowerCase()
      : ['pending', 'on-time', 'missed', 'late'][prayer.status];

    if (name && status && status !== 'pending') {
      statuses[name] = status === 'completed' ? 'on-time' : status;
    }
    return statuses;
  }, {});
}

export async function getPrayerMonth(userId, year, month) {
  const response = await fetch(
    `${API_URL}/api/Prayer/${encodeURIComponent(userId)}/month/${year}/${month}`
  );
  return readResponse(response, 'Unable to load monthly prayer data');
}

export async function getPrayerStreak(userId) {
  const response = await fetch(`${API_URL}/api/Prayer/${encodeURIComponent(userId)}/stats/streak`);
  return readResponse(response, 'Unable to load prayer streak');
}

export async function getOrCreatePrayerDay(userId, date) {
  const dateString = formatPrayerDate(date);
  const path = `${API_URL}/api/Prayer/${encodeURIComponent(userId)}/${dateString}`;
  const existingResponse = await fetch(path);

  if (existingResponse.ok) {
    return readResponse(existingResponse, 'Unable to load prayer data');
  }

  if (existingResponse.status !== 404) {
    await readResponse(existingResponse, 'Unable to load prayer data');
  }

  const createResponse = await fetch(path, { method: 'POST' });
  if (createResponse.status === 409) {
    const retryResponse = await fetch(path);
    return readResponse(retryResponse, 'Unable to load prayer data');
  }
  return readResponse(createResponse, 'Unable to create prayer data');
}

export async function savePrayerStatuses(userId, date, statuses) {
  const dateString = formatPrayerDate(date);
  const statusValues = { 'on-time': 1, missed: 2, late: 3 };
  const prayers = prayerNames.map((type, index) => ({
    type: index,
    status: statusValues[statuses[type]] ?? 0
  }));
  const response = await fetch(
    `${API_URL}/api/Prayer/${encodeURIComponent(userId)}/${dateString}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prayers })
    }
  );
  await readResponse(response, 'Unable to save prayer data');
}
