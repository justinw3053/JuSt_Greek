import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'justGreekAssets',
    access: (allow) => ({
        'audio/*': [
            allow.guest.to(['read']), // Publicly readable audio
            allow.authenticated.to(['read', 'write']),
        ],
        'user-recordings/{entity_id}/*': [
            allow.authenticated.to(['read', 'write', 'delete']), // Users own their recordings
            allow.guest.to(['read']),
        ],
    }),
});
