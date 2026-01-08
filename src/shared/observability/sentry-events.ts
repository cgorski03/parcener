export const SENTRY_EVENTS = {
  QUERY: {
    FAILURE: 'query.failure',
  },
  MUTATION: {
    FAILURE: 'mutation.failure',
  },
  AUTH: {
    SIGN_OUT: 'auth.sign_out',
    SIGN_IN: 'auth.sign_in',
    SESSION_CHECK: 'auth.session_check',
  },
  RECEIPT: {
    UPLOAD: 'receipt.upload',
    ENQUEUE: 'receipt.enqueue',
    PROCESS_JOB: {
      SUCCESS: 'receipt.process_job.success',
      OTHER_ERROR: 'receipt.process_job.other_error',
      PARSE_AI_JSON: 'receipt.process_job.parse_ai_json',
      ZOD_VALIDATION_FAIL: 'receipt.process_job.zod_validation_fail',
      IMAGE_MISSING: 'receipt.process_job.image_missing',
    },
    GET_DETAILS: 'receipt.get_details',
    CHECK_VALIDITY: 'receipt.check_validity',
  },
  RECEIPT_EDIT: {
    UPDATE_ITEM: 'receipt_edit.update_item',
    DELETE_ITEM: 'receipt_edit.delete_item',
    CREATE_ITEM: 'receipt_edit.create_item',
    FINALIZE: 'receipt_edit.finalize_totals',
  },
  ROOM: {
    CREATE: 'room.create',
    GET_DETAILS: 'room.get_details',
    GET_PULSE: 'room.get_pulse',
    JOIN: 'room.join',
    UPGRADE_MEMBER: 'room.upgrade_member',
    UPDATE_NAME: 'room.update_name',
    UPDATE_PAYMENT_METHOD_ID: 'room.update_payment_method_id',
    CLAIM_ITEM: 'room.claim_item',
  },
  ACCOUNT: {
    // Error in the action of checking the rate limits
    CHECK_UPLOAD_LIMITS: 'account.check_upload_limits',
    CHECK_INVITE_LIMITS: 'account.check_invite_limits',
    // Request blocked by a rate limit - not an issue
    UPLOAD_LIMIT: 'account.upload_limit',
    INVITE_LIMIT: 'account.invite_limit',
    // Error creating limit
    CREATE_INVITATION: 'account.create_invitation',
    ACCEPT_INVITATION: 'account.accept_invitation',
    GET_PROFILE: 'account.get_profile',
    GET_RECENT_RECEIPTS: 'account.get_recent_receipts',
    GET_RECENT_ROOMS: 'account.get_recent_rooms',
    PAYMENT_METHOD: {
      CREATE: 'account.payment_method.create',
      GET: 'account.payment_method.get',
      DELETE: 'account.payment_method.delete',
    },
  },
  SOCIAL: {
    SHARE_LINK: 'social.share_link',
    COPY_TO_CLIPBOARD: 'social.copy_to_clipboard',
  },
} as const;
