const SUIT_COLORS = {
  crimson: '#C82C31', navy: '#2561A5', emerald: '#21875E',
  violet: '#6D469C', onyx: '#303746', azure: '#2A94B8', gold: '#D89A26'
};
const ACCENT_COLORS = {
  gold: '#F3C64B', silver: '#D9E1E5', crimson: '#E3443B',
  cyan: '#58D8E3', lime: '#A5D65B', coral: '#F08065', violet: '#B88EE9'
};

export const suitColors = Object.keys(SUIT_COLORS);
export const accentColors = Object.keys(ACCENT_COLORS);

function shade(hex, ratio) {
  const number = parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0].map(shift => Math.round(((number >> shift) & 255) * ratio).toString(16).padStart(2, '0')).join('')}`;
}

export function renderHero(config, skinPresets, hairPresets) {
  const ink = '#161926';
  const skin = skinPresets[config.skinColor];
  const hair = hairPresets[config.hairColor];
  const suit = SUIT_COLORS[config.suitColor];
  const accent = ACCENT_COLORS[config.accentColor];
  const darkSuit = shade(suit, .62);
  const darkSkin = shade(skin, .8);
  const pose = config.pose || 'guardian';
  const pieces = [];
  const rect = (x, y, w, h, color) => pieces.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`);
  const path = (points, color) => pieces.push(`<polygon points="${points}" fill="${color}"/>`);

  // The cape sits behind the body. Its stair-step edges keep the silhouette pixelated.
  if (config.cape !== 'none') {
    const capeColor = config.cape === 'dark' ? darkSuit : accent;
    path('10,24 30,24 35,32 37,50 31,49 28,44 12,44 9,49 3,50 5,32', ink);
    path('11,26 29,26 33,33 35,47 30,46 27,41 13,41 10,46 5,47 7,33', capeColor);
    rect(7, 34, 2, 9, shade(capeColor, .76));
    rect(31, 34, 2, 9, shade(capeColor, .76));
  }

  // Each pose changes the outer silhouette, not just the costume color.
  if (pose === 'dash') {
    path('11,37 18,37 16,45 10,49 6,49 7,45 11,42', ink);
    path('12,38 17,38 14,44 9,47 8,46', suit);
    rect(5, 47, 10, 5, ink); rect(6, 48, 8, 3, accent);
    path('22,36 29,36 31,47 35,47 35,52 26,52 26,47', ink);
    path('23,37 28,37 30,48 34,48 34,51 27,51 27,46', suit);
    rect(27, 48, 7, 2, accent);
    path('7,25 12,25 15,30 10,35 5,32 2,26 3,20 7,20', ink);
    path('7,26 11,26 13,30 9,33 6,31 4,26 5,21 7,21', suit);
    rect(3, 20, 5, 4, accent);
    path('29,27 35,27 38,32 35,37 30,36 28,32', ink);
    path('30,28 34,28 36,32 34,35 30,35 29,32', suit);
    rect(33, 34, 4, 4, accent);
  } else if (pose === 'mystic') {
    rect(11, 36, 8, 16, ink); rect(21, 36, 8, 16, ink);
    rect(12, 37, 6, 12, suit); rect(22, 37, 6, 12, suit);
    rect(10, 47, 10, 6, ink); rect(20, 47, 10, 6, ink);
    rect(11, 48, 8, 4, darkSuit); rect(21, 48, 8, 4, darkSuit);
    path('2,24 9,25 13,30 11,34 5,32 0,30', ink);
    path('3,25 8,26 11,30 10,32 5,30 1,29', suit);
    path('38,24 31,25 27,30 29,34 35,32 40,30', ink);
    path('37,25 32,26 29,30 30,32 35,30 39,29', suit);
    rect(0, 26, 4, 4, accent); rect(36, 26, 4, 4, accent);
  } else {
    rect(11, 36, 8, 16, ink); rect(21, 36, 8, 16, ink);
    rect(12, 37, 6, 12, suit); rect(22, 37, 6, 12, suit);
    rect(10, 47, 10, 6, ink); rect(20, 47, 10, 6, ink);
    rect(11, 48, 8, 4, darkSuit); rect(21, 48, 8, 4, darkSuit);
    rect(12, 48, 5, 2, accent); rect(22, 48, 5, 2, accent);
    rect(5, 26, 7, 15, ink); rect(28, 26, 7, 15, ink);
    rect(6, 27, 5, 10, suit); rect(29, 27, 5, 10, suit);
    rect(6, 35, 5, 5, accent); rect(29, 35, 5, 5, accent);
    rect(6, 39, 5, 3, ink); rect(29, 39, 5, 3, ink);
    rect(7, 39, 3, 2, skin); rect(30, 39, 3, 2, skin);
  }

  // Suit, shoulders and belt.
  path('11,24 29,24 32,28 29,38 11,38 8,28', ink);
  path('12,25 28,25 30,29 28,37 12,37 10,29', suit);
  rect(12, 26, 3, 9, shade(suit, 1.16));
  rect(25, 26, 3, 9, darkSuit);
  if (config.suitStyle === 'armor') {
    rect(8, 26, 7, 4, accent); rect(25, 26, 7, 4, accent);
    rect(13, 31, 5, 2, darkSuit); rect(22, 31, 5, 2, darkSuit);
  } else if (config.suitStyle === 'tech') {
    rect(11, 27, 3, 3, accent); rect(26, 27, 3, 3, accent);
    rect(15, 34, 10, 1, accent);
  } else {
    path('12,26 20,29 28,26 27,28 20,31 13,28', accent);
  }
  rect(11, 36, 18, 3, ink); rect(12, 36, 16, 2, accent);
  rect(18, 36, 4, 3, ink); rect(19, 36, 2, 2, '#F9E8B9');

  // Original geometric chest marks, rather than existing hero logos.
  rect(16, 28, 8, 7, ink);
  rect(17, 29, 6, 5, accent);
  if (config.emblem === 'bolt') path('21,29 18,32 20,32 19,34 23,31 21,31', ink);
  if (config.emblem === 'star') path('20,29 21,31 23,31 21,32 22,34 20,33 18,34 19,32 17,31 19,31', ink);
  if (config.emblem === 'shield') path('18,30 22,30 22,32 20,34 18,32', ink);
  if (config.emblem === 'diamond') path('20,29 23,31 20,34 17,31', ink);
  if (config.emblem === 'moon') { rect(18, 30, 4, 4, ink); rect(20, 29, 3, 3, accent); }

  // Neck, ears and face.
  rect(17, 21, 6, 6, ink); rect(18, 21, 4, 5, skin);
  const headX = config.faceShape === 'wide' ? 10 : config.faceShape === 'square' ? 11 : 12;
  const headW = config.faceShape === 'wide' ? 20 : config.faceShape === 'square' ? 18 : 16;
  if (['long', 'ponytail', 'bob', 'afro'].includes(config.hair)) {
    rect(10, 9, 20, 17, ink); rect(11, 10, 18, 15, hair);
  }
  rect(headX - 1, 8, headW + 2, 15, ink);
  rect(headX, 9, headW, 13, skin);
  rect(headX, 18, headW, 4, darkSkin);
  rect(headX + 1, 9, headW - 2, 10, skin);
  rect(headX - 2, 14, 2, 4, skin); rect(headX + headW, 14, 2, 4, skin);
  if (config.mask !== 'none') {
    rect(headX, config.mask === 'full' ? 9 : 13, headW, config.mask === 'full' ? 11 : 5, darkSuit);
    rect(headX + 1, 13, 5, 3, ink); rect(headX + headW - 6, 13, 5, 3, ink);
  }
  // Eyes retain expressive pixel shapes inside the mask.
  const eyeColor = config.mask === 'none' ? ink : '#F7F6E7';
  rect(headX + 3, 14, 3, config.eyes === 'narrow' ? 1 : 2, eyeColor);
  rect(headX + headW - 6, 14, 3, config.eyes === 'narrow' ? 1 : 2, eyeColor);
  if (config.eyes === 'wink') rect(headX + 3, 14, 3, 1, darkSkin);
  if (config.eyes === 'happy') { rect(headX + 3, 15, 3, 1, skin); rect(headX + headW - 6, 15, 3, 1, skin); }
  if (config.eyes === 'angry') { rect(headX + 2, 12, 4, 1, ink); rect(headX + headW - 6, 12, 4, 1, ink); }
  if (config.mask !== 'full') {
    rect(19, 17, 2, 2, darkSkin);
    rect(config.mouth === 'frown' ? 18 : 17, 20, config.mouth === 'open' ? 5 : 6, 1, ink);
    if (config.mouth === 'open') rect(19, 20, 3, 2, ink);
    if (config.mouth === 'grin') rect(18, 21, 5, 1, '#FFF5DB');
    if (config.mouth === 'frown') { rect(17, 19, 2, 1, ink); rect(23, 19, 2, 1, ink); }
  }

  // Hair outlines are drawn last so they frame the face and sit over the mask.
  if (config.hair !== 'bald') {
    if (config.hair === 'mohawk') {
      rect(18, 2, 4, 9, ink); rect(19, 3, 2, 7, hair);
    } else if (config.hair === 'spiky') {
      path('10,11 12,4 15,7 18,3 21,6 25,3 28,8 30,11', ink);
      path('12,10 13,6 16,9 19,5 22,8 25,5 28,10', hair);
    } else if (config.hair === 'afro') {
      rect(9, 5, 22, 9, ink); rect(11, 3, 18, 9, hair); rect(13, 2, 14, 2, hair);
    } else {
      rect(11, 6, 18, 5, ink); rect(12, 6, 16, 4, hair);
      rect(10, 9, 5, 4, ink); rect(11, 9, 4, 3, hair);
      if (['long', 'bob', 'ponytail'].includes(config.hair)) {
        rect(10, 11, 3, config.hair === 'long' ? 14 : 9, hair);
        rect(27, 11, 3, config.hair === 'long' ? 14 : 9, hair);
      }
      if (config.hair === 'ponytail') { rect(29, 11, 4, 14, ink); rect(30, 12, 2, 12, hair); }
      if (config.hair === 'curly') { rect(13, 5, 4, 4, hair); rect(22, 5, 4, 4, hair); }
      if (config.hair === 'bangs') rect(17, 10, 6, 3, hair);
    }
  }

  if (config.accessories === 'glasses' || config.accessories === 'sunglasses') {
    const lens = config.accessories === 'sunglasses' ? ink : '#D6EEF7';
    rect(13, 13, 5, 4, ink); rect(22, 13, 5, 4, ink); rect(18, 14, 4, 1, ink);
    rect(14, 14, 3, 2, lens); rect(23, 14, 3, 2, lens);
  }
  if (config.accessories === 'hat') { rect(10, 6, 20, 3, ink); rect(14, 2, 12, 5, accent); }
  if (config.accessories === 'headband') rect(12, 9, 16, 2, accent);
  if (config.accessories === 'earrings') { rect(10, 18, 2, 3, accent); rect(28, 18, 2, 3, accent); }

  if (pose === 'guardian') {
    path('0,29 5,27 9,30 8,38 4,42 0,39', ink);
    path('1,30 5,29 8,31 7,37 4,40 1,38', accent);
    rect(3, 32, 3, 4, darkSuit);
  }
  if (pose === 'dash') {
    rect(0, 15, 4, 1, accent); rect(0, 18, 6, 1, accent);
    rect(35, 42, 5, 1, accent); rect(37, 45, 3, 1, accent);
  }
  if (pose === 'mystic') {
    rect(8, 7, 3, 20, darkSuit); rect(29, 7, 3, 20, darkSuit);
    rect(11, 5, 18, 3, darkSuit);
    rect(0, 22, 3, 3, accent); rect(37, 22, 3, 3, accent);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56" shape-rendering="crispEdges" role="img">${pieces.join('')}</svg>`;
}
