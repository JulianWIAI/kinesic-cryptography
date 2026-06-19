/**
 * SOMATIC CIPHER DECODER — Data Ledger v3
 *
 * Structure per entry:
 *   category         — 'Physical' | 'Emotional' | 'Intellectual'  (somatic stream)
 *   face             — Facial articulation description
 *   body             — Somatic posture description
 *   value            — Numeric letter value (A=1 … Z=26; Ä=1.5, Ö=15.5, Ü=21.5; null for digits)
 *   archetypeCategory — Psycholinguistic category: Origin | Kinetic | Sovereign | Liminal | Resonant | null
 */

export const SOMATIC_DICTIONARY = {

  // ── Letters ────────────────────────────────────────────

  'a': {
    category: 'Physical',
    face: 'Point next to lips upwards to nose, downwards to next lip. Mouth slightly open forming a line.',
    body: 'A person walking, distinctly showing two legs.',
    value: 1,
    archetypeCategory: 'Origin',
  },
  'ä': {
    category: 'Physical',
    face: 'Upper lip raised slightly, creating a sharper, more tense vowel shape than A.',
    body: 'A person mid-step, weight shifting — the liminal moment between stances.',
    value: 1.5,
    archetypeCategory: 'Liminal',
  },
  'b': {
    category: 'Physical',
    face: 'Lips pressed tightly together, building outward pressure.',
    body: 'Two eyes looking forward, or a rounded profile.',
    value: 2,
    archetypeCategory: 'Kinetic',
  },
  'c': {
    category: 'Emotional',
    face: 'A wide, curving smile.',
    body: 'A human body curling into a fetal or bending position.',
    value: 3,
    archetypeCategory: 'Resonant',
  },
  'd': {
    category: 'Physical',
    face: 'A wide, open laughing mouth.',
    body: 'A person standing tall holding a curved bow.',
    value: 4,
    archetypeCategory: 'Sovereign',
  },
  'e': {
    category: 'Intellectual',
    face: 'Lips stretched horizontally with tension.',
    body: 'A human being displaying feet, hands, and face clearly.',
    value: 5,
    archetypeCategory: 'Kinetic',
  },
  'f': {
    category: 'Physical',
    face: 'Upper teeth resting firmly on the lower lip.',
    body: 'A person standing upright with arms pointing forward.',
    value: 6,
    archetypeCategory: 'Kinetic',
  },
  'g': {
    category: 'Physical',
    face: 'Throat and tongue engaged, associated with swallowing.',
    body: 'A crouching or grounded posture.',
    value: 7,
    archetypeCategory: 'Liminal',
  },
  'h': {
    category: 'Emotional',
    face: 'An open mouth exhaling a breath of air.',
    body: 'Two humans connecting or holding hands.',
    value: 8,
    archetypeCategory: 'Resonant',
  },
  'i': {
    category: 'Intellectual',
    face: 'Narrow lips, feeling of focus moving upward to the brain.',
    body: 'An upright human, focus entirely on the head/intellect.',
    value: 9,
    archetypeCategory: 'Sovereign',
  },
  'j': {
    category: 'Physical',
    face: 'Pursed lips moving forward and down.',
    body: 'A person swinging a leg downward.',
    value: 10,
    archetypeCategory: 'Kinetic',
  },
  'k': {
    category: 'Intellectual',
    face: 'A sharp, angular click in the back of the throat.',
    body: 'A person kicking an arm and leg outward.',
    value: 11,
    archetypeCategory: 'Sovereign',
  },
  'l': {
    category: 'Physical',
    face: 'Pressure on the nose forming a straight line to the tongue.',
    body: 'A person sitting on the ground with legs straight out.',
    value: 12,
    archetypeCategory: 'Resonant',
  },
  'm': {
    category: 'Emotional',
    face: 'Closed lips humming, feeling vibration.',
    body: 'Two people leaning inward together.',
    value: 13,
    archetypeCategory: 'Resonant',
  },
  'n': {
    category: 'Physical',
    face: 'Tongue pressing firmly behind the upper teeth.',
    body: 'A person kneeling on one leg.',
    value: 14,
    archetypeCategory: 'Liminal',
  },
  'o': {
    category: 'Emotional',
    face: 'A perfectly open, round mouth.',
    body: 'A person with arms joined in a circle above their head.',
    value: 15,
    archetypeCategory: 'Resonant',
  },
  'ö': {
    category: 'Emotional',
    face: 'A rounded, slightly tightened mouth — the O vowel filtered through depth.',
    body: 'A figure peering inward, weight pulling downward toward the centre.',
    value: 15.5,
    archetypeCategory: 'Liminal',
  },
  'p': {
    category: 'Physical',
    face: 'A sudden pop of the lips releasing air.',
    body: 'A person standing confidently with one hand on their hip.',
    value: 16,
    archetypeCategory: 'Kinetic',
  },
  'q': {
    category: 'Intellectual',
    face: 'Round lips with a tongue thrust to the side.',
    body: 'A person standing, leaning on a walking stick.',
    value: 17,
    archetypeCategory: 'Sovereign',
  },
  'r': {
    category: 'Physical',
    face: 'The bowl formed by the mouth, resonating in the throat.',
    body: 'A person walking forward carrying a heavy backpack.',
    value: 18,
    archetypeCategory: 'Liminal',
  },
  's': {
    category: 'Physical',
    face: 'Teeth together, hissing air forming an S-curve.',
    body: 'A twisting torso in motion.',
    value: 19,
    archetypeCategory: 'Kinetic',
  },
  't': {
    category: 'Intellectual',
    face: 'Tongue striking the front teeth sharply.',
    body: 'A person standing with arms stretched horizontally.',
    value: 20,
    archetypeCategory: 'Sovereign',
  },
  'u': {
    category: 'Emotional',
    face: 'Lips pushed outward and rounded upward.',
    body: 'A person with both arms raised in a U-shape.',
    value: 21,
    archetypeCategory: 'Resonant',
  },
  'ü': {
    category: 'Emotional',
    face: 'Lips pushed forward and upward with tension — a rising, transcendent vowel shape.',
    body: 'A figure reaching upward, toes barely touching the ground.',
    value: 21.5,
    archetypeCategory: 'Liminal',
  },
  'v': {
    category: 'Physical',
    face: 'Lower lip vibrating against upper teeth.',
    body: 'A person balancing dynamically on one leg.',
    value: 22,
    archetypeCategory: 'Kinetic',
  },
  'w': {
    category: 'Physical',
    face: 'Wide moving lips, expanding outward.',
    body: 'A group of people holding their arms up together.',
    value: 23,
    archetypeCategory: 'Sovereign',
  },
  'x': {
    category: 'Intellectual',
    face: 'Clenched teeth resisting pressure.',
    body: 'A person jumping with limbs spread wide.',
    value: 24,
    archetypeCategory: 'Sovereign',
  },
  'y': {
    category: 'Emotional',
    face: 'Jaw dropping open in a long vertical stretch.',
    body: 'A person with arms raised pleadingly to the sky.',
    value: 25,
    archetypeCategory: 'Resonant',
  },
  'z': {
    category: 'Physical',
    face: 'Buzzing teeth with a zigzag of air.',
    body: 'A kneeling person leaning their torso heavily backward.',
    value: 26,
    archetypeCategory: 'Sovereign',
  },

  // ── Numbers — numeric value and archetypeCategory are not applicable ──

  '0': {
    category: 'Physical',
    face: 'A hollow, empty mouth.',
    body: 'A pregnant belly or an empty space/hole.',
    value: null,
    archetypeCategory: null,
  },
  '1': {
    category: 'Intellectual',
    face: 'Sharp focus isolating the nose.',
    body: 'A perfectly straight pillar or upright stance.',
    value: null,
    archetypeCategory: null,
  },
  '2': {
    category: 'Emotional',
    face: 'Relaxed, passive lower face.',
    body: 'A sitting, relaxing person.',
    value: null,
    archetypeCategory: null,
  },
  '3': {
    category: 'Emotional',
    face: 'Puckered lips forming a double curve.',
    body: 'A person with pronounced curved hips/posture.',
    value: null,
    archetypeCategory: null,
  },
  '4': {
    category: 'Intellectual',
    face: 'Square, rigid jawline.',
    body: 'A rigid chair or seated frame.',
    value: null,
    archetypeCategory: null,
  },
  '5': {
    category: 'Physical',
    face: 'Puffed out lower cheeks.',
    body: 'A human with a prominent belly.',
    value: null,
    archetypeCategory: null,
  },
  '6': {
    category: 'Physical',
    face: 'Lower lip curled deeply inward.',
    body: 'A human sitting, focusing on the lower body.',
    value: null,
    archetypeCategory: null,
  },
  '7': {
    category: 'Intellectual',
    face: 'Sharp, piercing gaze, tight lips.',
    body: 'A smart person pushing their head forward aggressively.',
    value: null,
    archetypeCategory: null,
  },
  '8': {
    category: 'Emotional',
    face: 'Two distinct spheres of tension in the cheeks.',
    body: 'Two humans permanently bound or connected.',
    value: null,
    archetypeCategory: null,
  },
  '9': {
    category: 'Intellectual',
    face: 'Raised eyebrows, focus pulled to the top of the head.',
    body: 'A human entirely focused on the brain/transcendence.',
    value: null,
    archetypeCategory: null,
  },

};
