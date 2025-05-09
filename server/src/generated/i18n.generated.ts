/* DO NOT EDIT, file generated by nestjs-i18n */

/* eslint-disable */
/* prettier-ignore */
import { Path } from "nestjs-i18n";
/* prettier-ignore */
export type I18nTranslations = {
    "account": {
        "unique": {
            "username": string;
            "email": string;
        };
        "validation": {
            "is_empty": string;
        };
        "error": {
            "exists": string;
            "login_fail": string;
            "username_or_email_exists": string;
            "email_exists": string;
            "not_found": string;
            "invalid_password": string;
            "invalid_token": string;
        };
    };
    "common": {
        "validation": {
            "error": string;
        };
        "error": {
            "internal_server_error": string;
            "entity_not_found": string;
            "many_request": string;
        };
    };
    "relation": {
        "unique": {
            "username": string;
            "email": string;
        };
        "validation": {
            "is_empty": string;
        };
        "error": {
            "exists": string;
            "not_exists": string;
            "login_fail": string;
            "not_handle": string;
        };
    };
    "user": {
        "unique": {
            "username": string;
            "email": string;
        };
        "validation": {
            "is_empty": string;
        };
        "error": {
            "username_or_email_exists": string;
            "email_exists": string;
            "not_found": string;
            "invalid_password": string;
            "invalid_token": string;
        };
    };
};
/* prettier-ignore */
export type I18nPath = Path<I18nTranslations>;
