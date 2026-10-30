// Makes usernames and temporary passwords for new students.

const crypto = require('crypto');

// Turns a full name into a username:
// "Priya Sharma" -> "priya.sharma", "José Núñez" -> "jose.nunez", "Arjun" -> "arjun"
// (If the name is taken, the route adds a number: priya.sharma2, priya.sharma3, ...)
function usernameBase(fullName) {
  const words = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents: é -> e
    .toLowerCase()
    .replace(/['’]/g, '') // drop apostrophes: o'brien -> obrien
    .replace(/[^a-z0-9\s]/g, ' ') // anything else that isn't a letter, number or space becomes a space
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'student';
  const base = words.length === 1 ? words[0] : `${words[0]}.${words[words.length - 1]}`;
  return base.slice(0, 24);
}

// Easy-to-read characters only: no 0/o or 1/l/i, which look alike
const PASSWORD_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

// A random password like "k7mq-x4tz-p9wd": 3 groups of 4 characters.
// crypto.randomInt is a secure random number generator, so passwords can't be guessed.
function generateTempPassword() {
  const groups = [];
  for (let g = 0; g < 3; g++) {
    let group = '';
    for (let i = 0; i < 4; i++) {
      group += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
    }
    groups.push(group);
  }
  return groups.join('-');
}

module.exports = { usernameBase, generateTempPassword };
