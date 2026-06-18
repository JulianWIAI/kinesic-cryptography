/**
 * SOMATIC CIPHER DECODER — Data Ledger v2
 *
 * Structure per entry:
 *   category  — 'Physical' | 'Emotional' | 'Intellectual'
 *   face      — Facial articulation description
 *   body      — Somatic posture description
 */

export const SOMATIC_DICTIONARY = {

  // ── Letters ────────────────────────────────────────────

  'a': {
    category: 'Physical',
    face: 'Point next to lips upwards to nose, downwards to next lip. Mouth slightly open forming a line.',
    body: 'A person walking, distinctly showing two legs.',
  },
  'b': {
    category: 'Physical',
    face: 'Lips pressed tightly together, building outward pressure.',
    body: 'Two eyes looking forward, or a rounded profile.',
  },
  'c': {
    category: 'Emotional',
    face: 'A wide, curving smile.',
    body: 'A human body curling into a fetal or bending position.',
  },
  'd': {
    category: 'Physical',
    face: 'A wide, open laughing mouth.',
    body: 'A person standing tall holding a curved bow.',
  },
  'e': {
    category: 'Intellectual',
    face: 'Lips stretched horizontally with tension.',
    body: 'A human being displaying feet, hands, and face clearly.',
  },
  'f': {
    category: 'Physical',
    face: 'Upper teeth resting firmly on the lower lip.',
    body: 'A person standing upright with arms pointing forward.',
  },
  'g': {
    category: 'Physical',
    face: 'Throat and tongue engaged, associated with swallowing.',
    body: 'A crouching or grounded posture.',
  },
  'h': {
    category: 'Emotional',
    face: 'An open mouth exhaling a breath of air.',
    body: 'Two humans connecting or holding hands.',
  },
  'i': {
    category: 'Intellectual',
    face: 'Narrow lips, feeling of focus moving upward to the brain.',
    body: 'An upright human, focus entirely on the head/intellect.',
  },
  'j': {
    category: 'Physical',
    face: 'Pursed lips moving forward and down.',
    body: 'A person swinging a leg downward.',
  },
  'k': {
    category: 'Intellectual',
    face: 'A sharp, angular click in the back of the throat.',
    body: 'A person kicking an arm and leg outward.',
  },
  'l': {
    category: 'Physical',
    face: 'Pressure on the nose forming a straight line to the tongue.',
    body: 'A person sitting on the ground with legs straight out.',
  },
  'm': {
    category: 'Emotional',
    face: 'Closed lips humming, feeling vibration.',
    body: 'Two people leaning inward together.',
  },
  'n': {
    category: 'Physical',
    face: 'Tongue pressing firmly behind the upper teeth.',
    body: 'A person kneeling on one leg.',
  },
  'o': {
    category: 'Emotional',
    face: 'A perfectly open, round mouth.',
    body: 'A person with arms joined in a circle above their head.',
  },
  'p': {
    category: 'Physical',
    face: 'A sudden pop of the lips releasing air.',
    body: 'A person standing confidently with one hand on their hip.',
  },
  'q': {
    category: 'Intellectual',
    face: 'Round lips with a tongue thrust to the side.',
    body: 'A person standing, leaning on a walking stick.',
  },
  'r': {
    category: 'Physical',
    face: 'The bowl formed by the mouth, resonating in the throat.',
    body: 'A person walking forward carrying a heavy backpack.',
  },
  's': {
    category: 'Physical',
    face: 'Teeth together, hissing air forming an S-curve.',
    body: 'A twisting torso in motion.',
  },
  't': {
    category: 'Intellectual',
    face: 'Tongue striking the front teeth sharply.',
    body: 'A person standing with arms stretched horizontally.',
  },
  'u': {
    category: 'Emotional',
    face: 'Lips pushed outward and rounded upward.',
    body: 'A person with both arms raised in a U-shape.',
  },
  'v': {
    category: 'Physical',
    face: 'Lower lip vibrating against upper teeth.',
    body: 'A person balancing dynamically on one leg.',
  },
  'w': {
    category: 'Physical',
    face: 'Wide moving lips, expanding outward.',
    body: 'A group of people holding their arms up together.',
  },
  'x': {
    category: 'Intellectual',
    face: 'Clenched teeth resisting pressure.',
    body: 'A person jumping with limbs spread wide.',
  },
  'y': {
    category: 'Emotional',
    face: 'Jaw dropping open in a long vertical stretch.',
    body: 'A person with arms raised pleadingly to the sky.',
  },
  'z': {
    category: 'Physical',
    face: 'Buzzing teeth with a zigzag of air.',
    body: 'A kneeling person leaning their torso heavily backward.',
  },

  // ── Numbers ────────────────────────────────────────────

  '0': {
    category: 'Physical',
    face: 'A hollow, empty mouth.',
    body: 'A pregnant belly or an empty space/hole.',
  },
  '1': {
    category: 'Intellectual',
    face: 'Sharp focus isolating the nose.',
    body: 'A perfectly straight pillar or upright stance.',
  },
  '2': {
    category: 'Emotional',
    face: 'Relaxed, passive lower face.',
    body: 'A sitting, relaxing person.',
  },
  '3': {
    category: 'Emotional',
    face: 'Puckered lips forming a double curve.',
    body: 'A person with pronounced curved hips/posture.',
  },
  '4': {
    category: 'Intellectual',
    face: 'Square, rigid jawline.',
    body: 'A rigid chair or seated frame.',
  },
  '5': {
    category: 'Physical',
    face: 'Puffed out lower cheeks.',
    body: 'A human with a prominent belly.',
  },
  '6': {
    category: 'Physical',
    face: 'Lower lip curled deeply inward.',
    body: 'A human sitting, focusing on the lower body.',
  },
  '7': {
    category: 'Intellectual',
    face: 'Sharp, piercing gaze, tight lips.',
    body: 'A smart person pushing their head forward aggressively.',
  },
  '8': {
    category: 'Emotional',
    face: 'Two distinct spheres of tension in the cheeks.',
    body: 'Two humans permanently bound or connected.',
  },
  '9': {
    category: 'Intellectual',
    face: 'Raised eyebrows, focus pulled to the top of the head.',
    body: 'A human entirely focused on the brain/transcendence.',
  },

};
