export const getDateDifference = (expiredAt) => {
  const expiryDate = new Date(expiredAt);
  const currentDate = new Date();
  const diff = expiryDate.getTime() - currentDate.getTime();
  if (diff < 0) {
    return {
      time: diff,
      days: 0,
      hrs: 0,
      mins: 0,
      secs: 0,
    };
  }
  return {
    time: diff,
    days: Math.floor(diff / 86400000), // days
    hrs: Math.floor((diff % 86400000) / 3600000), // hours
    mins: Math.round(((diff % 86400000) % 3600000) / 60000), // minutes
    secs: Math.round(((diff % 86400000) % 3600000) / 60000 / 60000), // seconds
  };
};

export function addDays(date: Date, number: number) {
  const newDate = new Date(date);
  return new Date(newDate.setDate(newDate.getDate() + number));
}
