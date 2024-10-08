const LOG_PREFIX = "[TIMECOP_INDICATOR_LOG_START]"
const LOG_SUFFIX = "[TIMECOP_INDICATOR_LOG_END]"
export function info(...msgs) {
    console.warn(LOG_PREFIX,`[${getDateString()}]`, "[INFO]", ...msgs, LOG_SUFFIX);
    /*console.warn(LOG_PREFIX,JSON.stringify({
        "date": getDateString(),
        "type": "INFO",
        "msg": msgs
    }), LOG_SUFFIX);*/
}

function getDateString() {
    return (new Date()).toISOString();
}
