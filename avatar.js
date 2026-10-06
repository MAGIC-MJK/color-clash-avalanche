import { generateRandomConfig, getAvailableParts, SKIN_PRESETS, HAIR_PRESETS } from '@ignaciocabeza/bitface';
import { renderHero, suitColors, accentColors } from './hero-renderer.js';

const parts = getAvailableParts();
export const avatarFields = {
  pose: ['guardian', 'dash', 'mystic'],
  suitStyle: ['classic', 'armor', 'tech'],
  suitColor: suitColors,
  accentColor: accentColors,
  cape: ['none', 'bright', 'dark'],
  mask: ['none', 'eyes', 'full'],
  emblem: ['bolt', 'star', 'shield', 'diamond', 'moon'],
  faceShape: ['round', 'square', 'wide'],
  eyes: ['big', 'narrow', 'wink', 'happy', 'angry'],
  mouth: ['smile', 'frown', 'open', 'grin'],
  hair: parts.hair,
  accessories: parts.accessories,
  skinColor: Object.keys(SKIN_PRESETS),
  hairColor: Object.keys(HAIR_PRESETS)
};

const chineseOptions = {
  guardian:'守护姿态', dash:'冲刺姿态', mystic:'法术姿态',
  classic:'经典战衣', armor:'装甲战衣', tech:'科技战衣',
  crimson:'绯红', navy:'深蓝', emerald:'翡翠绿', violet:'紫罗兰', onyx:'曜石黑', azure:'天蓝', gold:'金色',
  silver:'银色', cyan:'青蓝', lime:'荧光绿', coral:'珊瑚红',
  bright:'亮色披风', dark:'深色披风', eyes:'眼罩', full:'全脸面罩',
  bolt:'闪电', star:'星芒', shield:'盾形', diamond:'菱形', moon:'月牙',
  round:'圆脸', oval:'椭圆脸', square:'方脸', heart:'心形脸', long:'长脸', diamond:'菱形脸', wide:'宽脸',
  big:'大眼', small:'小眼', narrow:'细眼', wink:'眨眼', happy:'笑眼', angry:'怒眼', dots:'豆豆眼', sleepy:'睡眼', cross:'叉叉眼',
  smile:'微笑', frown:'皱眉', open:'张嘴', flat:'平嘴', teeth:'露齿', smirk:'坏笑', grin:'大笑', tongue:'吐舌', oh:'惊讶',
  short:'短发', curly:'卷发', mohawk:'莫西干', bald:'光头', ponytail:'马尾', spiky:'刺猬头', bob:'波波头', afro:'爆炸头', bangs:'刘海',
  glasses:'眼镜', sunglasses:'墨镜', hat:'帽子', headband:'发带', earrings:'耳环', none:'无',
  light:'浅色', medium:'自然色', tan:'小麦色', brown:'棕色', dark:'深色', pale:'白皙',
  black:'黑色', blonde:'金色', red:'红色', gray:'灰色', white:'白色', auburn:'赤褐色', strawberry:'草莓色', platinum:'铂金色', pink:'粉色', blue:'蓝色', purple:'紫色', teal:'青绿色'
};

export function avatarOptionLabel(value, field) {
  if (!document.documentElement.lang.startsWith('zh')) return value[0].toUpperCase() + value.slice(1);
  if (field === 'hair' && value === 'long') return '长发';
  if (field === 'eyes' && value === 'round') return '圆眼';
  if (field === 'eyes' && value === 'heart') return '爱心眼';
  if (field === 'hairColor' && value === 'brown') return '棕色';
  if (field === 'suitColor' && value === 'gold') return '金黄';
  if (field === 'cape' && value === 'none') return '不穿披风';
  if (field === 'mask' && value === 'none') return '不戴面罩';
  if (field === 'cape' && value === 'dark') return '深色披风';
  if (field === 'mask' && value === 'eyes') return '眼罩';
  if (field === 'emblem' && value === 'diamond') return '菱形徽记';
  return chineseOptions[value] || value;
}

const defaults = {
  pose: 'guardian',
  suitStyle: 'classic', suitColor: 'navy', accentColor: 'gold',
  cape: 'bright', mask: 'eyes', emblem: 'star',
  faceShape: 'round', eyes: 'big', eyebrows: 'arched', mouth: 'smile',
  nose: 'button', ears: 'small', hair: 'short', beard: 'none',
  accessories: 'none', skinColor: 'medium', hairColor: 'black', eyeColor: 'brown'
};

export function cleanAvatar(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...defaults };
  const avatar = { ...defaults };
  for (const [field, options] of Object.entries(avatarFields)) {
    if (options.includes(value[field])) avatar[field] = value[field];
  }
  return avatar;
}

export function randomAvatar() {
  const pick = options => options[Math.floor(Math.random() * options.length)];
  return cleanAvatar({ ...generateRandomConfig(), suitStyle: pick(avatarFields.suitStyle),
    pose: pick(avatarFields.pose),
    suitColor: pick(suitColors), accentColor: pick(accentColors),
    cape: pick(avatarFields.cape), mask: pick(avatarFields.mask), emblem: pick(avatarFields.emblem) });
}

export function avatarDataUrl(config) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderHero(cleanAvatar(config), SKIN_PRESETS, HAIR_PRESETS))}`;
}

export const heroPresets = {
  guardian: { pose: 'guardian', suitStyle: 'armor', suitColor: 'navy', accentColor: 'gold', cape: 'bright', mask: 'eyes', emblem: 'shield', hair: 'short', hairColor: 'black' },
  spark: { pose: 'dash', suitStyle: 'tech', suitColor: 'crimson', accentColor: 'gold', cape: 'none', mask: 'full', emblem: 'bolt', hair: 'spiky', hairColor: 'red' },
  shadow: { pose: 'mystic', suitStyle: 'classic', suitColor: 'onyx', accentColor: 'violet', cape: 'dark', mask: 'eyes', emblem: 'moon', hair: 'long', hairColor: 'black' }
};

export function loadAvatar() {
  try { return cleanAvatar(JSON.parse(localStorage.getItem('color-clash-avatar'))); }
  catch { return cleanAvatar(null); }
}

export function saveAvatar(config) {
  localStorage.setItem('color-clash-avatar', JSON.stringify(cleanAvatar(config)));
}

export function loadHeroes() {
  try {
    const heroes = JSON.parse(localStorage.getItem('color-clash-heroes'));
    if (!Array.isArray(heroes)) return [];
    return heroes.filter(hero => typeof hero.id === 'string' && typeof hero.name === 'string')
      .map(hero => ({ id: hero.id, name: hero.name.slice(0, 24), avatar: cleanAvatar(hero.avatar) }));
  } catch { return []; }
}

export function saveHeroes(heroes) {
  localStorage.setItem('color-clash-heroes', JSON.stringify(heroes));
}
