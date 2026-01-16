import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== JuSt_Greek Learning Schema ============================================
 * Syllabus: Read-only for users, managed by Admin (You).
 * UserProgress: Unique per user, tracks completed topics.
 *=========================================================================*/
const schema = a.schema({
  Syllabus: a
    .model({
      topicId: a.id().required(),      // e.g. "1.1"
      chapter: a.integer().required(), // e.g. 1
      month: a.string().required(),    // e.g. "The Foundation"
      title: a.string().required(),    // e.g. "The Alphabet"
      description: a.string(),
      content: a.string(),             // Main text content
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']), // Everyone can read content
      allow.owner(),                     // Admins can update
    ]),

  UserProgress: a
    .model({
      userId: a.id().required(),
      completedTopics: a.string().array(), // List of topicIds
      currentStreak: a.integer().default(0),
      xp: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.owner(), // Users can only see/edit their own progress
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
