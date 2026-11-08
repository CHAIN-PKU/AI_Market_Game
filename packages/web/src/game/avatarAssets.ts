export type MixamoAvatar = { name: string; label: string; url: string; thumb: string };

/** Local Mixamo avatars from three.ws Character Library. See docs/CHARACTER_ASSETS.md. */
export const MIXAMO_AVATARS: MixamoAvatar[] = [
  { name: 'arissa', label: 'Arissa', url: '/assets/mixamo/arissa.glb', thumb: '/assets/mixamo/thumbs/arissa.png' },
  { name: 'medea-by-m-arrebola', label: 'Medea', url: '/assets/mixamo/medea-by-m-arrebola.glb', thumb: '/assets/mixamo/thumbs/medea-by-m-arrebola.png' },
  { name: 'aj', label: 'AJ', url: '/assets/mixamo/aj.glb', thumb: '/assets/mixamo/thumbs/aj.png' },
  { name: 'alex', label: 'Alex', url: '/assets/mixamo/alex.glb', thumb: '/assets/mixamo/thumbs/alex.png' },
  { name: 'claire', label: 'Claire', url: '/assets/mixamo/claire.glb', thumb: '/assets/mixamo/thumbs/claire.png' },
  { name: 'ty', label: 'Ty', url: '/assets/mixamo/ty.glb', thumb: '/assets/mixamo/thumbs/ty.png' },
  { name: 'akai-e-espiritu', label: 'Akai', url: '/assets/mixamo/akai-e-espiritu.glb', thumb: '/assets/mixamo/thumbs/akai-e-espiritu.png' },
  { name: 'lola-b-styperek', label: 'Lola', url: '/assets/mixamo/lola-b-styperek.glb', thumb: '/assets/mixamo/thumbs/lola-b-styperek.png' },
];

export function avatarAt(index: number): MixamoAvatar {
  return MIXAMO_AVATARS[index % MIXAMO_AVATARS.length]!;
}
