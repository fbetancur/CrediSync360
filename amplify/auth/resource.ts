import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Custom attributes para multitenant y roles
    'custom:tenantId': {
      dataType: 'String',
      mutable: false, // No se puede cambiar después de crear el usuario
    },
    'custom:role': {
      dataType: 'String',
      mutable: true, // Se puede cambiar el rol del usuario
    },
  },
});
