export const SENTRY_EVENTS = {
    QUERY: {
        FAILURE: "query.failure",
    },
    MUTATION: {
        FAILURE: "mutation.failure",
    },
    AUTH: {
        SIGN_OUT: "auth.sign_out",
        SIGN_IN: "auth.sign_in",
    },
    RECEIPT: {
        UPLOAD: "receipt.upload",
        PROCESS_JOB: {
            SUCCESS: "receipt.process_job.success",
            OTHER_ERROR: "receipt.process_job.other_error",
            PARSE_AI_JSON: "receipt.process_job.parse_ai_json",
            ZOD_VALIDATION_FAIL: "receipt.process_job.zod_validation_fail",
            IMAGE_MISSING: "receipt.process_job.image_missing",
        }
    },
    ACCOUNT: {
        CHECK_UPLOAD_LIMITS: "account.check_upload_limits",
        CHECK_INVITE_LIMITS: "account.check_invite_limits",
        GET_PROFILE: "account.get_profile",
    },
    SOCIAL: {
        SHARE_LINK: "social.share_link",
        COPY_TO_CLIPBOARD: "social.copy_to_clipboard",
    }
} as const;
